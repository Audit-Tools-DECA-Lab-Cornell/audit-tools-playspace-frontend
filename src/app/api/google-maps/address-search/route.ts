"use server";

import { NextRequest, NextResponse } from "next/server";

const GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const MAX_SUGGESTIONS = 5;

interface GoogleAddressComponent {
	long_name: string;
	types: string[];
}

interface GoogleGeocodeResult {
	address_components: GoogleAddressComponent[];
	geometry: {
		location: {
			lat: number;
			lng: number;
		};
	};
	formatted_address: string;
}

interface GoogleGeocodeResponse {
	error_message?: string;
	results: GoogleGeocodeResult[];
	status: string;
}

interface AddressSuggestionResponse {
	address: string;
	city: string | null;
	country: string | null;
	formattedAddress: string;
	lat: number;
	lng: number;
	postalCode: string | null;
	province: string | null;
}

function getGeocodingApiKey(): string | null {
	return process.env.GOOGLE_MAPS_GEOCODING_API_KEY ?? process.env.GOOGLE_MAPS_SERVER_API_KEY ?? null;
}

function getAddressComponent(components: GoogleAddressComponent[], type: string): string | null {
	const component = components.find(candidate => candidate.types.includes(type));
	return component?.long_name ?? null;
}

function buildStreetAddress(components: GoogleAddressComponent[], formattedAddress: string): string {
	const streetNumber = getAddressComponent(components, "street_number");
	const route = getAddressComponent(components, "route");
	const premise = getAddressComponent(components, "premise");
	const subpremise = getAddressComponent(components, "subpremise");

	if (streetNumber !== null && route !== null) {
		return `${streetNumber} ${route}`;
	}
	if (premise !== null && subpremise !== null) {
		return `${premise} ${subpremise}`;
	}
	if (premise !== null) {
		return premise;
	}

	const [firstSegment] = formattedAddress.split(",");
	return firstSegment?.trim().length ? firstSegment.trim() : formattedAddress;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
	const apiKey = getGeocodingApiKey();
	if (apiKey === null) {
		return NextResponse.json({ message: "Server address search is not configured." }, { status: 503 });
	}

	const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
	if (query.length < 3) {
		return NextResponse.json({ suggestions: [] satisfies AddressSuggestionResponse[] });
	}

	const params = new URLSearchParams({
		address: query,
		key: apiKey
	});

	const response = await fetch(`${GEOCODING_API_URL}?${params.toString()}`, {
		cache: "no-store",
		method: "GET"
	});

	if (!response.ok) {
		return NextResponse.json({ message: "Google address lookup failed." }, { status: 502 });
	}

	const data = (await response.json()) as GoogleGeocodeResponse;
	if (data.status === "ZERO_RESULTS") {
		return NextResponse.json({ suggestions: [] satisfies AddressSuggestionResponse[] });
	}
	if (data.status !== "OK") {
		return NextResponse.json(
			{
				message: data.error_message ?? "Google address lookup was rejected.",
				googleStatus: data.status
			},
			{ status: 502 }
		);
	}

	const suggestions: AddressSuggestionResponse[] = [];
	const seenFormattedAddresses = new Set<string>();
	console.log("data", data.results);

	for (const result of data.results) {
		if (seenFormattedAddresses.has(result.formatted_address)) {
			continue;
		}
		seenFormattedAddresses.add(result.formatted_address);
		suggestions.push({
			address: buildStreetAddress(result.address_components, result.formatted_address),
			city: getAddressComponent(result.address_components, "locality"),
			country: getAddressComponent(result.address_components, "country"),
			formattedAddress: result.formatted_address,
			lat: result.geometry.location.lat,
			lng: result.geometry.location.lng,
			postalCode: getAddressComponent(result.address_components, "postal_code"),
			province: getAddressComponent(result.address_components, "administrative_area_level_1")
		});
		if (suggestions.length >= MAX_SUGGESTIONS) {
			break;
		}
	}

	return NextResponse.json({ suggestions });
}
