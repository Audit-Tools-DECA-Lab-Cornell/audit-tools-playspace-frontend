"use server";

import { NextRequest, NextResponse } from "next/server";

const GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";

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
	status: string;
	error_message?: string;
	results: GoogleGeocodeResult[];
}

interface GeocodeSuccessPayload {
	lat: number;
	lng: number;
	city: string | null;
	province: string | null;
	country: string | null;
	postalCode: string | null;
	formattedAddress: string | null;
}

function getGeocodingApiKey(): string | null {
	return process.env.GOOGLE_MAPS_GEOCODING_API_KEY ?? process.env.GOOGLE_MAPS_SERVER_API_KEY ?? null;
}

function getAddressComponent(components: GoogleAddressComponent[], type: string): string | null {
	const component = components.find(candidate => candidate.types.includes(type));
	return component?.long_name ?? null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	const apiKey = getGeocodingApiKey();
	if (!apiKey) {
		return NextResponse.json({ message: "Server geocoding is not configured." }, { status: 503 });
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return NextResponse.json({ message: "Invalid geocoding request body." }, { status: 400 });
	}

	const addressParts =
		typeof payload === "object" &&
		payload !== null &&
		Array.isArray((payload as { addressParts?: unknown }).addressParts)
			? (payload as { addressParts: unknown[] }).addressParts
			: null;

	if (addressParts === null) {
		return NextResponse.json({ message: "addressParts must be an array." }, { status: 400 });
	}

	const normalizedAddressParts = addressParts.filter(
		(value): value is string => typeof value === "string" && value.trim().length > 0
	);

	if (normalizedAddressParts.length === 0) {
		return NextResponse.json({ message: "At least one address field is required for geocoding." }, { status: 400 });
	}

	const params = new URLSearchParams({
		address: normalizedAddressParts.join(", "),
		key: apiKey
	});

	const response = await fetch(`${GEOCODING_API_URL}?${params.toString()}`, {
		method: "GET",
		cache: "no-store"
	});

	if (!response.ok) {
		return NextResponse.json({ message: "Google geocoding request failed." }, { status: 502 });
	}

	const data = (await response.json()) as GoogleGeocodeResponse;
	if (data.status !== "OK" || data.results.length === 0) {
		const statusCode = data.status === "ZERO_RESULTS" ? 404 : 502;
		return NextResponse.json(
			{
				message: data.error_message ?? "No results found for the provided address.",
				googleStatus: data.status
			},
			{ status: statusCode }
		);
	}

	const topResult = data.results[0];
	const successPayload: GeocodeSuccessPayload = {
		lat: topResult.geometry.location.lat,
		lng: topResult.geometry.location.lng,
		city: getAddressComponent(topResult.address_components, "locality"),
		province: getAddressComponent(topResult.address_components, "administrative_area_level_1"),
		country: getAddressComponent(topResult.address_components, "country"),
		postalCode: getAddressComponent(topResult.address_components, "postal_code"),
		formattedAddress: topResult.formatted_address ?? null
	};

	return NextResponse.json(successPayload);
}
