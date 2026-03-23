import type { InstrumentTranslations } from "@/lib/instrument-translations";

/**
 * Auto-generated translation overrides for the de instrument locale.
 *
 * Regenerate with `python3 scripts/translations/translate_i18n.py --format instrument`.
 */
export const deInstrumentTranslations = {
	metadata: {
		instrumentName: "Playspace Play Value and Usability Audit Tool",
		currentSheet: "PVUA v5.2"
	},
	preamble: [
		"Das Playspace Play Value and Usability Audit Tool ist in 22 Domänen gegliedert. Jede Domäne umfasst zwischen 2 und 12 Items, die ein bestimmtes Merkmal der Umgebung beschreiben.",
		"Jedes Item wird anhand von bis zu vier Skalen bewertet: Menge, Vielfalt, Sozialität und Herausforderung. Nicht alle Items enthalten jede Skala.",
		"Die Menge wird immer zuerst beantwortet. Wenn die Antwort zur Menge eine Null-ähnliche Antwort wie Nein oder Nicht zutreffend ist, bleiben die übrigen Skalen verborgen, da sie nicht anwendbar sind.",
		"Nach jeder Domäne können Sie Notizen oder Empfehlungen zu Änderungen erfassen, die den Spielwert und die Nutzbarkeit des Spielbereichs verbessern könnten.",
		"Das Tool unterstützt zwei Teile: ein Vor-Ort-Audit der physischen Umgebung und eine Umfrage zu ökologischen und Management-Aspekten des Spielbereichs."
	],
	executionModes: {
		both: {
			label: "Ich kenne den Spielbereich sehr gut und bin vor Ort.",
			description: "Beantworten Sie sowohl die Umfrage als auch die Vor-Ort-Audit-Items."
		},
		survey: {
			label: "Ich kenne den Spielbereich sehr gut, bin aber nicht vor Ort.",
			description: "Beantworten Sie nur die Umfrage-Items."
		},
		audit: {
			label: "Ich kenne den Spielbereich nicht, bin aber vor Ort.",
			description: "Beantworten Sie nur die Vor-Ort-Audit-Items."
		}
	},
	preAuditQuestions: {
		audit_date: {
			label: "Datum des Audits",
			description: "Wird automatisch generiert, wenn die Auditsitzung erstellt wird."
		},
		started_at: {
			label: "Startzeit des Audits",
			description: "Wird automatisch generiert, wenn die Auditsitzung erstellt wird."
		},
		submitted_at: {
			label: "Endzeit des Audits",
			description: "Wird automatisch generiert, wenn das Audit eingereicht wird."
		},
		total_minutes: {
			label: "Gesamtzeit in Minuten",
			description: "Wird automatisch anhand der Start- und Endzeitstempel berechnet."
		},
		season: {
			label: "Aktuelle Jahreszeit",
			options: {
				spring: {
					label: "Frühling"
				},
				summer: {
					label: "Sommer"
				},
				autumn: {
					label: "Herbst"
				},
				winter: {
					label: "Winter"
				}
			}
		},
		weather_conditions: {
			label: "Wetterbedingungen zum Zeitpunkt des Audits",
			options: {
				sunshine: {
					label: "Sonnenschein"
				},
				cloudy: {
					label: "Bewölkt"
				},
				windy: {
					label: "Windig"
				},
				inclement_weather: {
					label: "Unbeständiges Wetter"
				}
			}
		},
		users_present: {
			label: "Nutzerinnen und Nutzer im Spielbereich zum Zeitpunkt des Audits",
			options: {
				none: {
					label: "Keine"
				},
				children: {
					label: "Kinder"
				},
				adults: {
					label: "Erwachsene"
				}
			}
		},
		user_count: {
			label: "Anzahl der Nutzerinnen und Nutzer",
			options: {
				none: {
					label: "Keine"
				},
				some: {
					label: "Einige"
				},
				a_lot: {
					label: "Viele"
				}
			}
		},
		age_groups: {
			label: "Geschätzte Altersgruppen der Kinder, die den Spielbereich nutzen",
			options: {
				under_5: {
					label: "Unter 5 Jahren"
				},
				age_6_10: {
					label: "6–10 Jahre"
				},
				age_11_plus: {
					label: "10+ Jahre"
				}
			}
		},
		place_size: {
			label: "Größe des Spielraums nach Ihrer Einschätzung",
			options: {
				small: {
					label: "Klein"
				},
				medium: {
					label: "Mittel"
				},
				large: {
					label: "Groß"
				}
			}
		}
	},
	scales: {
		quantity: {
			title: "Menge",
			prompt: "In welchem Umfang ist dieses Merkmal oder diese Umgebungsqualität vorhanden?",
			description:
				"Menge bezieht sich darauf, wie viele spezifische Angebote oder Umgebungsmerkmale verfügbar sind.",
			options: {
				no: {
					label: "Nein"
				},
				some: {
					label: "Einige"
				},
				a_lot: {
					label: "Viele"
				},
				not_applicable: {
					label: "Nicht zutreffend"
				}
			}
		},
		diversity: {
			title: "Vielfalt",
			prompt: "Inwieweit ist Vielfalt bei diesem Merkmal oder dieser Umgebungsqualität gegeben?",
			description:
				"Vielfalt bewertet, ob die bereitgestellten Elemente abwechslungsreich sind oder alle gleich sind.",
			options: {
				not_applicable: {
					label: "Nicht zutreffend"
				},
				no_diversity: {
					label: "Keine Vielfalt"
				},
				some_diversity: {
					label: "Etwas Vielfalt"
				},
				a_lot_of_diversity: {
					label: "Sehr viel Vielfalt"
				}
			}
		},
		sociability: {
			title: "Sozialität",
			prompt: "Können mehr als ein Kind oder eine Person diese Funktion gemeinsam nutzen?",
			description:
				"Sozialität berücksichtigt, ob die Funktion allein, zu zweit oder in größeren Gruppen genutzt werden kann.",
			options: {
				not_applicable: {
					label: "Nicht zutreffend"
				},
				no: {
					label: "Nein"
				},
				yes_a_pair: {
					label: "Ja – zu zweit"
				},
				yes_more_than_two_children: {
					label: "Ja – mehr als zwei Kinder"
				}
			}
		},
		challenge: {
			title: "Herausforderung",
			prompt: "Inwieweit bietet dieses Merkmal oder diese Umgebungsqualität unterschiedliche Schwierigkeitsgrade?",
			description:
				"Herausforderung bewertet, ob die Funktion Möglichkeiten mit unterschiedlichen Schwierigkeitsgraden bietet.",
			options: {
				not_applicable: {
					label: "Nicht zutreffend"
				},
				no_challenge: {
					label: "Keine Herausforderung"
				},
				some_challenge: {
					label: "Etwas Herausforderung"
				},
				a_lot_of_challenge: {
					label: "Sehr viel Herausforderung"
				}
			}
		}
	},
	sections: {
		section_1_playspace_character_community: {
			title: "Charakter & Gemeinschaft des Spielraums",
			description:
				"Charakter & Gemeinschaft des Spielraums beschreibt Aspekte eines Spielraums, die Nutzerinnen und Nutzern die Möglichkeit bieten, sich mit dem Spielplatz zu verbinden. Diese Aspekte beziehen sich auf lokale Geschichte/Tradition/Kunst/Geschichten, auf Gemeinschaftsveranstaltungen, die im Spielraum stattfinden, sowie darauf, wie und für wen der Spielraum konzipiert wurde.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielraum...",
			notesPrompt:
				"Kommentare? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung des Charakters und der Einbindung der Gemeinschaft in diesen Spielraum:",
			questions: {
				q_1_1: {
					prompt: "wurde **unter Einbeziehung der Nutzerinnen und Nutzer** des Spielraums entwickelt oder gestaltet (z. B. Kinder; Eltern; Gemeinschaftsorganisationen)"
				},
				q_1_2: {
					prompt: "**wurde speziell entwickelt oder gestaltet**, um Spielmöglichkeiten** für eine oder mehrere bekannte unterversorgte Bevölkerungsgruppen** wie Mädchen, Minderheiten oder Kinder mit unterschiedlichen Bedürfnissen zu bieten"
				},
				q_1_3: {
					prompt: "** spiegelt kulturelle und historische Aspekte der Gemeinschaft wider** (z. B. werden lokale Kunst, Geschichten oder das kulturelle Erbe dargestellt; es werden lokal beschaffte Materialien verwendet)"
				},
				q_1_4: {
					prompt: "**weist** **einzigartige oder neuartige Aspekte/Möglichkeiten** auf, die es von anderen Spielorten unterscheiden (z. B. stark naturnah gestalteter Spielplatz; Bereiche oder Elemente, die von Kindern geformt und verändert werden können; skulpturale Spielelemente)"
				},
				q_1_5: {
					prompt: "**wird** **von Erwachsenen betreut**, **die das Spielen der Kinder aktiv fördern** (z. B. indem sie in der Umgebung neue Möglichkeiten für neue / veränderte Spielformen schaffen)"
				},
				q_1_6: {
					prompt: "**bezieht die Nutzerinnen und Nutzer** des Spielplatzes (Kinder und/oder Erwachsene) **in Instandhaltungsaktivitäten ein** (z. B. bei der Gestaltung der Grünanlagen, beim Streichen; weist in der Nähe wohnenden Erwachsenen zu, ein Auge auf den Spielbereich zu haben)"
				},
				q_1_7: {
					prompt: "**veranstaltet gemeinschaftliche Events**"
				}
			}
		},
		section_2_playspace_location_connectivity: {
			title: "Lage & Anbindung des Spielbereichs",
			description:
				"Lage & Anbindung des Spielbereichs beschreibt, wie der Spielbereich in das Umfeld eingebettet ist, ob weitere Spiel- und Freizeitmöglichkeiten vorhanden sind und wie Nutzerinnen und Nutzer den Spielbereich erreichen.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der Lage und Anbindung dieses Spielbereichs:",
			questions: {
				q_2_1: {
					prompt: "ist **zu Fuß oder mit dem Fahrrad über Wege erreichbar**"
				},
				q_2_2: {
					prompt: "ist **mit öffentlichen Verkehrsmitteln erreichbar** (z. B. gibt es eine Haltestelle an oder nahe mindestens einem Eingang)"
				},
				q_2_3: {
					prompt: "liegt **in der Nähe eines Wohngebiets** (innerhalb von 10 Minuten zu Fuß)"
				},
				q_2_4: {
					prompt: "liegt **in der Nähe von Schulen und/oder Kinderbetreuungseinrichtungen** (innerhalb von 10 Minuten zu Fuß)"
				},
				q_2_5: {
					prompt: "liegt **in der Nähe von oder zusammen mit anderen öffentlichen Angeboten**, die für Kinder und Familien interessant/wichtig sein könnten (z. B. Parkanlage; Gemeinschaftszentrum; Bibliothek; Einrichtungen; Treffpunkte der Gemeinschaft; Museen; Gemeinschaftsgarten; Naturflächen; Café)"
				},
				q_2_6: {
					prompt: "ist **in einen größeren naturnahen Bereich eingebettet oder mit ihm verbunden** (z. B. Wald; Gehölz; großer Garten; Naturschutzgebiet)"
				},
				q_2_7: {
					prompt: "liegt **unmittelbar an Straßen mit starkem oder schnellem Verkehr** ohne klare/sichere Überquerungsmöglichkeiten [Hinweis: Dieses Item muss umgekehrt bewertet werden]"
				}
			}
		},
		section_3_playspace_rules_restrictions: {
			title: "Regeln & Einschränkungen im Spielbereich",
			description:
				"Regeln & Einschränkungen im Spielbereich bewertet, ob Regeln und Einschränkungen das Spielen im Freien behindern.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der Regeln und Einschränkungen dieses Spielbereichs:",
			questions: {
				q_3_1: {
					prompt: "**schränkt bestimmte Altersgruppen** vom Spielbereich aus (z. B. ältere Kinder, Jugendliche)  [Dieses Item muss umgekehrt bewertet werden]"
				},
				q_3_2: {
					prompt: "**schränkt bestimmte Arten von Spiel oder Verhalten ein** (z. B. laut sein, Ballspielen; die Nutzung von Spielgeräten auf Rädern oder Schlitten)  [Dieses Item muss umgekehrt bewertet werden]"
				},
				q_3_3: {
					prompt: "**schränkt den Zugang von Kindern durch die Anforderung einer Aufsicht durch Erwachsene ein** (d. h. eine Betreuungsperson ist nicht zwingend erforderlich, außer vielleicht bei sehr kleinen Kindern; Kinder können den Spielbereich eigenständig nutzen)  [Dieses Item muss umgekehrt bewertet werden]"
				}
			}
		},
		section_4_playspace_information_wayfinding: {
			title: "Information & Orientierung im Spielbereich",
			description:
				"Information & Orientierung im Spielbereich bieten Orientierung im Spielbereich, Informationen dazu, wie man sich im Spielbereich zurechtfindet, und/oder Hinweise dazu, was zu tun ist oder wie der Spielplatz genutzt werden soll.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der Information und Orientierung dieses Spielbereichs:",
			questions: {
				q_4_1: {
					prompt: "hat **online verfügbare Informationen** zur Nutzung und zu den Merkmalen des Spielbereichs (z. B. Öffnungszeiten, Barrierefreiheit, ÖPNV-Anbindung, Parkmöglichkeiten)"
				},
				q_4_2: {
					prompt: "hat eine **einfach zu navigierende Anordnung** (z. B. klarer, logischer Hauptweg von Eingang zu Ausgang; deutlich definierte Spielzonen)"
				},
				q_4_3: {
					prompt: "hat **barrierefreie Karten und/oder Beschilderung an den Eingängen** zum Spielbereich, die Orientierung und Nutzungshinweise bieten (z. B. in erreichbarer Höhe für Rollstuhlnutzerinnen und -nutzer angebracht; mit Brailleschrift, Piktogrammen und/oder hohem Farbkontrast; Informationen per QR-Code verfügbar) a"
				},
				q_4_4: {
					prompt: "hat **kinderfreundliche, leicht les- und verständliche Karten und/oder Beschilderung an den Eingängen** (z. B. in einer für kleine Kinder geeigneten Höhe angebracht; mit einfacher Sprache, Symbolen und/oder Bildern)"
				},
				q_4_5: {
					prompt: "hat **barrierefreie Karten und/oder Beschilderung im Spielbereich verteilt**, die Orientierung und Nutzungshinweise bieten (z. B. in erreichbarer Höhe für Rollstuhlnutzerinnen und -nutzer angebracht; mit Brailleschrift, Piktogrammen und/oder hohem Farbkontrast; Informationen per QR-Code verfügbar) a"
				},
				q_4_6: {
					prompt: "hat **kinderfreundliche, leicht les- und verständliche Karten und/oder Beschilderung im Spielbereich verteilt** (z. B. in einer für kleine Kinder geeigneten Höhe angebracht; mit einfacher Sprache, Symbolen und/oder Bildern)a"
				}
			}
		},
		section_5_management_maintenance: {
			title: "Betrieb & Instandhaltung",
			description:
				"Betrieb und Instandhaltung umfassen Aspekte, die eine sichere und bespielbare Umgebung gewährleisten.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung des Betriebs und der Instandhaltung dieses Spielbereichs:",
			questions: {
				q_5_1: {
					prompt: "hat ein **aktuelles Sicherheitszertifikat **für Spielgeräte und/oder Oberflächen"
				},
				q_5_2: {
					prompt: "ist **im Allgemeinen gut instand gehalten**, mit wenigen bis keinen sichtbaren Gefahren wie gebrochener oder beschädigter Ausstattung/Bodenbelägen, Resten von entfernten Geräten, morschem oder rauem Holz, abblätternder Farbe"
				},
				q_5_3: {
					prompt: "ist **weitgehend sauber** und gepflegt (z. B. kaum/keine Graffiti, Zigarettenstummel, Abfall oder anderer gefährlicher Unrat wie z. B. Glasscherben, Spritzen, Tierkot, überwucherte Pflanzen)"
				},
				q_5_4: {
					prompt: "hat **ausreichend Abfallbehälter** im Verhältnis zur Größe des Spielbereichs und an relevanten Stellen (z. B. an/in der Nähe von Eingängen; bei Tisch-/Sitzbereichen)"
				},
				q_5_5: {
					prompt: "hat **allgegenwärtig unangenehme Gerüche**, auch in geschlossenen Bereichen (z. B. durch Tierkot, Rauch und/oder Abfall)  [Dieses Item muss umgekehrt bewertet werden]"
				},
				q_5_6: {
					prompt: "hat **einen Lagerbereich** für lose Teile und/oder Fahrgeräte"
				},
				q_5_7: {
					prompt: "ist **landschaftlich gestaltet und so gepflegt, dass neuartige Spielmöglichkeiten entstehen** (z. B. in die Vegetation geschnittene Tunnel; tiefe Äste und Felsblöcke bleiben zum Klettern erhalten; Bereiche mit Mähverzicht; herabgefallene Blätter/Blüten/kleine Äste werden absichtlich zum Spielen liegen gelassen; Vegetation wird nicht übermäßig zurückgeschnitten)"
				}
			}
		},
		section_6_climate_protection_adaptability: {
			title: "Klimaschutz & Anpassungsfähigkeit",
			description: "??",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der Wege in diesem Spielbereich:",
			questions: {
				q_6_1: {
					prompt: "bietet **Schatten oder Schutz** **für die meisten Sitzbereiche** zu irgendeinem Zeitpunkt im Tagesverlauf"
				},
				q_6_2: {
					prompt: "bietet **Schatten oder Schutz vor Sonne/ungünstigem Wetter in den meisten Hauptspielbereichen** zu irgendeinem Zeitpunkt im Tagesverlauf (z. B. durch Bäume/Vegetation; Gebäude; Schattenspender oder Überdachungen; Anordnung der Ausstattung)."
				},
				q_6_3: {
					prompt: "ist so gestaltet und/oder gepflegt, dass durch die **Anordnung von Elementen und/oder die Bepflanzung** Schutz vor ungünstigem Wetter/Sonne/Wind geboten wird (z. B. Windschutz durch immergrüne Bepflanzung)"
				},
				q_6_4: {
					prompt: "hat **eine angemessene Beleuchtung für den geografischen Standort und die örtlichen Bedingungen**, um ein Sicherheitsgefühl zu gewährleisten und die Nutzungszeiten zu verlängern (z. B. Beleuchtung, die für die Wintermonate, Abendstunden oder wechselnde Wetterbedingungen geeignet ist, und/oder beleuchtete Wege in den Spielbereich)"
				},
				q_6_5: {
					prompt: "hat **eine angemessene Entwässerung**, die Überschwemmungen oder große Mengen stehenden/stagnierenden Wassers verhindert"
				}
			}
		},
		section_7_boundaries_entrances: {
			title: "Abgrenzungen & Eingänge",
			description:
				"Abgrenzungen & Eingänge betrachtet den Zugang zu und die Abtrennung von Spielbereichen. Abgrenzungen sind klare Grenzen, die die Ränder eines Bereichs markieren oder unterschiedliche Aktivitätszonen definieren – dazu können Zäune, Mauern oder Hecken gehören. Eingänge sind die Stellen, an denen Personen Spielbereiche oder Aktivitätszonen betreten/verlassen – sie können formal sein (z. B. Tore) oder informell (z. B. Öffnungen in Abgrenzungen oder Veränderungen der Bodenoberfläche).",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der Wege in diesem Spielbereich:",
			questions: {
				q_7_1: {
					prompt: "hat Zäune/Abgrenzungen **zur Trennung von Spielbereichen und erheblichen Gefahren** wie Straßenverkehr oder tiefem Wasser"
				},
				q_7_2: {
					prompt: "hat Zäune/Abgrenzungen, die **visuell durchlässig** sind und eine gute Beobachtung/Aufsicht auf angrenzende Bereiche ermöglichen"
				},
				q_7_3: {
					prompt: "können **alle Tore von Erwachsenen leicht geöffnet werden** (einschließlich Personen mit eingeschränkter Griffkraft oder im Rollstuhl bzw. mit Mobilitätshilfe)"
				},
				q_7_4: {
					prompt: "haben **alle Bereiche, die von vollständigen Höhen** begrenzt sind/Zäune haben mehr als einen Ein- und Ausgang"
				}
			}
		},
		section_8_pathways: {
			title: "Wege",
			description: "??",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der Wege in diesem Spielbereich:",
			questions: {
				q_8_1: {
					prompt: "hat Hauptwege, die **vielfältige Fahr-/Lauf-/Geh-Erlebnisse bieten** (z. B. gerade und geschwungene Wege oder Schleifen; Wege mit Wellen oder Unebenheiten; Wege durch Tunnel oder Garten-/Waldbereiche)"
				},
				q_8_2: {
					prompt: "hat Hauptwege, die zu jedem Spielbereich/jeder Ausstattung führen und **fest und eben befestigt** sind, sodass sie von allen genutzt werden können, um darauf zu gehen, zu laufen oder zu fahren (einschließlich Mobilitätshilfen)"
				},
				q_8_3: {
					prompt: "hat Wege, die **breit genug für mindestens 2 Personen** sind, um nebeneinander zu fahren, zu laufen oder zu gehen"
				},
				q_8_4: {
					prompt: "hat Nebenwege, die **neuartige Spielrouten** bieten (z. B. ausgerichtete Baumstümpfe; Trittsteine durch einen Garten oder Bachlauf; Spielweg durch einen Weidentunnel oder eine Spielstruktur; ein Weg im hohen Gras; ein Tunnel unter einem Hügel oder Wall; ein Pfad mit taktiler Oberfläche)"
				}
			}
		},
		section_9_open_space: {
			title: "Offene Fläche",
			description:
				"Eine offene Fläche ist ein integrierter Bereich innerhalb oder um den Spielbereich herum ohne Spielelemente, andere bauliche Strukturen und ohne Bepflanzung. Offene Flächen sind Mehrzweckbereiche und werden flexibel genutzt; sie bieten vielfältige Möglichkeiten wie Laufen, Gehen, Spielen mit losen Teilen (Bälle, Hula-Hoops oder natürliche Elemente und andere), Sitzen oder Entspannen, Picknicks, Gruppenspiele, …",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der offenen Flächen dieses Spielbereichs:",
			questions: {
				q_9_1: {
					prompt: "hat **offene, größtenteils ebene Flächen** (mit wenig bis keiner Neigung), die vielfältiges Spiel wie Ball- oder Sportspiele, Gruppenspiele oder Treffen ermöglichen"
				},
				q_9_2: {
					prompt: "ein Teil der ebenen, offenen Flächen hat **zugängliche Oberflächen**, sodass Rollstühle oder Scooter genutzt werden können"
				}
			}
		},
		section_10_enclosed_bounded_spaces: {
			title: "Umgrenzte & begrenzte Bereiche",
			description:
				"Abgeschlossene und begrenzte Räume sind durch eine klare Begrenzung definiert und vollständig oder teilweise umschlossen. Sie kommen in natürlichen und gestalteten Umgebungen vor. Beispiele sind Nischen, kleine Vertiefungen, niedrige erhöhte Begrenzungen, die einen kleineren Raum einrahmen, Spielhütten, Verstecke, kleine über dem Boden liegende Bereiche, ...). Abgeschlossene und begrenzte Räume ermöglichen es Kindern, für sich zu sein, mit einer kleinen Gruppe von Kindern zusammen zu sein und sich auszutauschen, sich zu verstecken und von Erwachsenen weg oder sich von den Blicken der Erwachsenen entfernt zu fühlen. Abgeschlossene und begrenzte Räume können kreatives und fantasievolles Spiel ermöglichen.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielraum...",
			notesPrompt:
				"Kommentare? Beschreiben Sie eine oder mehrere Empfehlungen, um die abgeschlossenen und begrenzten Räume dieses Spielraums zu verbessern:",
			questions: {
				q_10_1: {
					prompt: "hat abgeschlossene oder begrenzte Räume, die **ein Gefühl von Geborgenheit/Umhüllung** vermitteln (z. B. hausähnlich, raumähnlich) oder **vollständig umschlossen sind** (z. B. Spielhäuser; Hütten oder Verstecke; Baumhäuser; abgeschlossene kleine Räume, die durch oder unter Bäumen/Sträuchern entstehen, abgeschlossene und begrenzte Räume, die erhöht oder auf Bodenhöhe liegen)"
				},
				q_10_2: {
					prompt: "hat abgeschlossene oder begrenzte Räume, die außerdem **die Möglichkeit bieten, nach draußen zu schauen und zu beobachten**, ohne von außen übermäßig sichtbar zu sein (z. B. Spielhaus mit kleinen Fenstern; Bootselement mit Bullaugen; Gras-Hütte mit kleiner Türöffnung)"
				},
				q_10_3: {
					prompt: "hat **niedrige erhöhte Begrenzungen/Kanten, die kleinere Räume definieren** (z. B. kleine Nischen; Nischen; Ecken; unterteilte Sandkästen)"
				}
			}
		},
		section_11_sport_game_spaces: {
			title: "Sport- und Spielflächen",
			description:
				"Sport- und Spielflächen sind abgegrenzte Bereiche, die Kindern eine bestimmte Art von Spiel ermöglichen, z. B. Fußball, Basketball und (Tisch-)Tennis. Diese Sport- und Spielflächen sind manchmal vom Spielplatz getrennt. Wenn Sportflächen nahe liegen oder in den Spielplatz integriert sind, nehmen Sie sie in die Bewertung auf.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielraum...",
			notesPrompt:
				"Kommentare? Beschreiben Sie eine oder mehrere Empfehlungen, um die Sport- und Spielflächen dieses Spielraums zu verbessern:",
			questions: {
				q_11_1: {
					prompt: "hat **Flächen, die Sport oder Spiele unterstützen können** (z. B. Fußballfelder, Basketball- oder Tennisplätze; Tischtennis; Straßenspiele)"
				},
				q_11_2: {
					prompt: "hat Sport-/Spielflächen mit **Oberflächen, die für die vorgesehenen Aktivitäten geeignet sind** (z. B. ebene, offene Rasen- oder Pflasterflächen für Fußball oder Basketball)"
				},
				q_11_3: {
					prompt: "hat Sport-/Spielflächen mit **geeigneter Ausrüstung oder Markierungen** für die Aktivität (z. B. Torpfosten; Basketballkörbe und -netze; Bodenmarkierungen für Völkerball oder Himmel und Hölle)"
				}
			}
		},
		section_12_manufactured_play_features: {
			title: "Künstlich hergestellte Spielelemente",
			description:
				"Künstlich hergestellte Spielelemente sind für das Spielen hergestellte Elemente, die auch als Spielgeräte oder Spielkomponenten bezeichnet werden. Sie können aus unterschiedlichen Materialien wie Kunststoff, Metall oder Holz hergestellt sein.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielraum...",
			notesPrompt:
				"Kommentare? Beschreiben Sie eine oder mehrere Empfehlungen, um die künstlich hergestellten Spielelemente dieses Spielraums zu verbessern:",
			questions: {
				q_12_1: {
					prompt: "hat **nicht vorgegebene oder locker geformte Spielstrukturen/-elemente, die Kindern die Möglichkeit geben, eigene Spielideen zu entwickeln** (z. B. nur ein Rahmen; mehrdeutige Strukturen; skulpturale Elemente; thematische Spielstrukturen oder -elemente)"
				},
				q_12_2: {
					prompt: "hat künstlich hergestellte Spielelemente, die **Rutschmöglichkeiten** bieten (z. B. offene Rutsche, geschlossene Rutsche, Rohrrutsche, Feuerwehrrutschstange, Seilbahn, Wellenrutsche, ...)"
				},
				q_12_3: {
					prompt: "hat künstlich hergestellte Spielelemente, die **Klettern, Hängen und/oder Hochziehen** ermöglichen (z. B. Turnringe; Klimmzugstange; Kletterwand; Klettergerüst; Leiter)"
				},
				q_12_4: {
					prompt: "hat künstlich hergestellte Spielelemente, die **Drehen/Rotieren** ermöglichen (z. B. Karussells; Drehspielgerät; gewundene Rutsche; Schaukeln, die sich drehen können)"
				},
				q_12_5: {
					prompt: "hat künstlich hergestellte Spielelemente, die **Balancieren** auf oder über etwas ermöglichen (z. B. Balancierbalken oder -stämme; Wackelbrett; schwankende Brücken; Balancierseile; schmale Plattformen)"
				},
				q_12_6: {
					prompt: "hat künstlich hergestellte Spielelemente, die **Schaukeln** ermöglichen (z. B. Wippe; Federwipper)"
				},
				q_12_7: {
					prompt: "hat künstlich hergestellte Spielelemente, die **Krabbeln** in, auf oder durch etwas ermöglichen (z. B. Krabbelnetz; Tunnel)"
				},
				q_12_8: {
					prompt: "hat künstlich hergestellte Spielelemente, die **Springen oder Hüpfen auf/ab** ermöglichen (z. B. Trampolin; Podest; Parkour-Elemente)"
				},
				q_12_9: {
					prompt: "hat künstlich hergestellte Spielelemente, die **durch Drücken, Schieben, Drehen, Öffnen und/oder Schließen Dinge manipulieren** ermöglichen (z. B. Lenkrad; bewegliche Fenster oder Türen; Spielpanel; Pumpe; Rolle; Musik-/Soundelemente)"
				},
				q_12_11: {
					prompt: "hat künstlich hergestellte Spielelemente, die **so angeordnet und/oder verbunden sind, dass Spielrouten** über ein oder mehrere Elemente hinweg möglich sind (z. B. ein integrierter Hindernisparcours; Elemente, die nah genug beieinander liegen, um das Spielen über mehrere Elemente hinweg zu erleichtern)"
				},
				q_12_12: {
					prompt: "hat **mehrere Auf- und Abgänge bei größeren Spielstrukturen** (z. B. Rampen; Stufen; Kletternetz/-wand; Zugang über Böschung) "
				}
			}
		},
		section_13_natural_play_features: {
			title: "Natürliche Spielelemente",
			description:
				"Natürliche Spielelemente können sich entweder im Spielraum oder in dessen Umgebung befinden. Natürliche Umgebungen umfassen Vegetation, Sträucher, hohes Gras, Bereiche mit Bäumen, Büschen, Felsblöcken und Steinen. Natürliche Elemente bieten eine Vielzahl von Spielmöglichkeiten, darunter körperlich aktives Spiel (z. B. Klettern), Erkunden, sensorisches Spiel, Manipulieren und das Entwickeln eigener Spielideen (z. B. soziodramatisches Spiel oder Fantasiespiel), Ausruhen, Alleinsein oder das Zusammensein mit anderen Kindern.",
			instruction:
				"Wichtig: Ihre Bewertung konzentriert sich auf die natürlichen Spielelemente, die vorhanden und zum Spielen gedacht sind. Nicht auf Elemente, die den Raum nur natürlich wirken lassen (z. B. Bäume, die nur Schatten spenden, aber nicht zum Klettern gedacht sind). Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielraum...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der natürlichen Spielelemente dieses Spielraums:",
			questions: {
				q_13_1: {
					prompt: "verfügt über **großflächige Vegetation**, die zum Spielen geeignet und zugänglich ist (z. B. Bäume; große Sträucher/Hecken, nicht zu stark zurückgeschnittene Äste an Bäumen)"
				},
				q_13_2: {
					prompt: "verfügt über **kleinflächige Vegetation**, die zum Spielen geeignet und zugänglich ist (z. B. kleinere Sträucher/Hecken; hohes Gras; Blumenbeete mit Wegen; Nicht-Mähbereich)"
				},
				q_13_3: {
					prompt: "verfügt über **dichtere oder höhere Vegetation**, die spielerisches Verstecken in/unter ihr oder das Finden eines „Geheimorts“ bzw. das Gefühl des Entdeckens oder Sich-„Verirrens“ ermöglicht (z. B. Irrgarten aus hohem Gras; tief hängende Baumkronen; dichte Hecken; belaubter Kletterbaum)"
				},
				q_13_4: {
					prompt: "verfügt über **feste natürliche Elemente**, die zum Klettern, Draufsitzen, Herunterspringen usw. einladen (z. B. mittelgroße bis große Felsbrocken, umgestürzte Bäume/Stämme)"
				}
			}
		},
		section_14_loose_manufactured_parts_equipment: {
			title: "Lose hergestellte Teile & Geräte",
			description:
				"Lose hergestellte Teile & Geräte sind von Menschen hergestellte Spielobjekte, die manchmal auf dem Spielplatz bereitgestellt werden, manchmal aber auch mitgebracht werden (z. B. lose geformte lose Teile, Kettcars, Roller, Fahrräder, Bälle/Frisbees oder anderes Spielzeug, Sand-/Matsch-/Wasserspielzeug)",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielraum...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der losen hergestellten Teile und Geräte dieses Spielraums:",
			questions: {
				q_14_1: {
					prompt: "verfügt über **kleine hergestellte lose Teile**, die **leicht und einfach zu bewegen/handhaben** sind, einschließlich solcher, die zur Manipulation formbarer Materialien und anderer loser Teile verwendet werden können (z. B. Becher; Eimer; Schaufeln; kleine Werkzeuge; Trichter; Bälle; leichte Seile; Stoffe; Bälle; Frisbees; Hula-Hoops; Schläger; Spielzeugautos/-boote; Puppen)"
				},
				q_14_2: {
					prompt: "verfügt über **mittelgroße hergestellte lose Teile**, die **etwas schwerer, aber dennoch relativ leicht zu bewegen/handhaben** sind (z. B. Kisten; Kistenbehälter; Verkehrskegel; Töpfe und Pfannen; Kunststoffrohre/PVC-Rohre; größere Bauklötze; Werkzeuge; größere Schaufeln/Rechen; schwere Seile)"
				},
				q_14_3: {
					prompt: "verfügt über **große hergestellte lose Teile**, die **schwerer sind und möglicherweise Hilfe beim Bewegen/Handhaben erfordern** (z. B. Reifen; Baumstümpfe; große Blöcke oder Bretter; Tische oder Stühle; bewegliche Klettergeräte)"
				},
				q_14_4: {
					prompt: "verfügt über **(rollbare) Fahrgeräte**, mit denen Kinder sich im Raum/auf den Wegen fortbewegen können (z. B. Roller, Fahrräder oder Dreiräder, Buggys, Skateboards, Schlitten/Rodel)"
				}
			}
		},
		section_15_loose_natural_parts_malleable_materials: {
			title: "Lose natürliche Teile & formbare Materialien",
			description:
				"Lose natürliche Teile & formbare Materialien umfassen Materialien wie Erde, Matsch, Sand, Wasser oder natürliche Teile wie Blätter, Blumen, Zweige, Steine, Zapfen und andere. Natürliche lose Teile ermöglichen Kindern zu sammeln, anzuordnen, zu gestalten, zu bauen, zu graben, zu mischen und zu erkunden; sie werden auch für sozio-dramatisches und kreatives Spielen genutzt. Die Materialien bieten sinnliche Möglichkeiten sowie zum Mischen, Graben, Transportieren, Füllen und Entleeren, Bauen, …",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielraum...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der losen natürlichen Teile und formbaren Materialien dieses Spielraums:",
			questions: {
				q_15_1: {
					prompt: "verfügt über **natürliche formbare Materialien**, die verfügbar sind **(z. B. Sand, Kies/Kieselsteine, Mulch, Erde, Matsch, Wasser, Schnee)"
				},
				q_15_2: {
					prompt: "gibt es in Bereichen, in denen formbare Materialien verfügbar sind, **natürliche oder hergestellte lose Teile** (z. B. Eimer/Schaufeln oder Stöcke in Sandbereichen; Töpfe, Schüsseln und Löffel im Matschbereich/der Küche)"
				},
				q_15_3: {
					prompt: "verfügt über **kleine natürliche lose Teile**, die verfügbar sind (oder in manchen Jahreszeiten bereitgestellt werden) und leicht und einfach zu bewegen/handhaben sind (z. B. Blätter; Rinde/Mulch; Tannenzapfen; Samen; Zweige oder kleine Äste; Früchte; Muscheln; Blumen, Schneebälle)"
				},
				q_15_4: {
					prompt: "verfügt über **mittelgroße natürliche lose Teile, die etwas schwerer sind**, aber dennoch relativ leicht zu bewegen/handhaben (z. B. Baumscheiben; faustgroße Steine; kleine Baumstümpfe; größere Zweige; Eisstücke)"
				},
				q_15_5: {
					prompt: "verfügt über **größere natürliche lose Teile, die schwerer sind** und möglicherweise Hilfe beim Bewegen/Handhaben erfordern (z. B. Holzstämme; große Äste; schwerere Steine; große Baumstümpfe)"
				},
				q_15_6: {
					prompt: "Kinder dürfen **lose Teile und/oder formbare Materialien gemeinsam verwenden** und/oder **sie von einer Spielzone in eine andere bewegen**"
				}
			}
		},
		section_16_seating: {
			title: "Sitzgelegenheiten",
			description:
				"Sitzgelegenheiten sind ein unterstützendes Element von Spielplätzen. Formellere Sitzgelegenheiten werden eher von Erwachsenen genutzt, die Kinder beaufsichtigen möchten. Informellere Sitzgelegenheiten können von Kindern zum Ausruhen, Sitzen, Beobachten anderer, Verweilen oder für die Interaktion mit Gleichaltrigen genutzt werden, fördern aber auch die Entwicklung kreativer und fantasievoller Spiele (Beispiele für informelle Sitzgelegenheiten: Podeste, Baumstämme, Baumstümpfe, Stufen, niedrige erhöhte Begrenzungen, Felsen, Picknicktische, Sitzmöglichkeiten in kleineren Räumen und in der Natur …)",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielraum...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der Sitzgelegenheiten dieses Spielraums:",
			questions: {
				q_16_1: {
					prompt: "bietet Sitzmöglichkeiten durch **formelle Sitzgelegenheiten** (z. B. Stühle; Bänke; Hocker; Picknicktische) **und/oder informelle Sitzgelegenheiten** (z. B. Podeste/Kanten; Baumstümpfe; Baumstämme; Felsbrocken, niedrige erhöhte Mauern)"
				},
				q_16_2: {
					prompt: "Sitzgelegenheiten sind innerhalb oder **am Rand der Hauptspielbereiche für eine gute Beobachtung** (durch Betreuungspersonen oder andere Kinder) vorhanden"
				},
				q_16_3: {
					prompt: "Sitzgelegenheiten sind **über den gesamten Spielraum verteilt** (z. B. in kleinen Bereichen; in Naturbereichen; innerhalb von Spielstrukturen oder -elementen)"
				},
				q_16_4: {
					prompt: "Es gibt Sitzgelegenheiten, die Möglichkeiten bieten, **sich in kleinen und größeren Gruppen hinzusetzen und zusammenzukommen** (z. B. Bank für 2–3 Personen; Amphitheater; Pavillon; Picknicktische)"
				},
				q_16_5: {
					prompt: "Es gibt **Sitzgelegenheiten, die soziale Interaktionen fördern** (z. B. kreisförmige Anordnung; einander in engem Abstand zugewandt angeordnet; Picknicktisch, Amphitheater) *mehr Beispiele benötigt?"
				},
				q_16_6: {
					prompt: "verfügt über **zugängliche Tische und/oder Sitzgelegenheiten** (z. B. Sitze mit Rückenlehnen und/oder Armlehnen; Platz unter Tischen für Rollstühle; ermöglicht den Transfer vom Mobilitätshilfsmittel auf die Sitzgelegenheit; feste, ebene Fläche neben anderen Sitzgelegenheiten für Mobilitätshilfen/Kinderwagen)"
				},
				q_16_7: {
					prompt: "Es gibt **hergestellte Spielelemente, auf denen man liegen oder sitzen kann** (z. B. bequemes Netz; Hängematte; integrierte Sitzgelegenheiten in der Struktur; Plattformen)"
				}
			}
		},
		section_17_amenities: {
			title: "Ausstattung",
			description:
				"Ausstattung sind unterstützende Elemente eines Spielplatzes, die dazu beitragen, den Spielplatz besonders für Familien, Kinder mit Behinderungen und Mädchen attraktiver und komfortabler zu machen.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der Ausstattung dieses Spielbereichs:",
			questions: {
				q_17_1: {
					prompt: "verfügt über **saubere, regelmäßig gewartete Toiletten**, die kostenlos und während der Öffnungszeiten des Spielbereichs öffentlich zugänglich sind"
				},
				q_17_2: {
					prompt: "verfügt über mindestens **eine Toilette** (in jedem Geschlechterbereich, falls getrennt), die **zugänglich** und für alle Nutzer geeignet ist (z. B. für Personen mit Mobilitätshilfen; groß genug für zwei Personen; mit Wickeltisch für Babys und/oder Erwachsene mit Transfersystem)"
				},
				q_17_3: {
					prompt: "verfügt über **Trinkbrunnen** oder Befüllstationen, die intuitiv zu bedienen sind, in zugänglicher Höhe bzw. in unterschiedlichen Höhen und auf einer zugänglichen Fläche angebracht sind"
				}
			}
		},
		section_18_topography_surfaces: {
			title: "Topografie & Oberflächen",
			description:
				"Topografie & Oberflächen umfassen Hügel, Hänge, Vertiefungen und Stufen im Gelände. Sie ermöglichen vielfältige Spielformen wie Rennen, Hinunterrollen, Gegenstände hinunterrollen lassen, Fahren, Klettern, Balancieren, Rodeln, Rutschen, das Genießen von Ausblicken und das Erleben von Höhen, Springen/Tauchen/Rollen in/über Pfützen, …)",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der Topografie und Oberflächen dieses Spielbereichs:",
			questions: {
				q_18_1: {
					prompt: "verfügt über **Topografie**, die **Unterschiede in Neigung, Gefälle und/oder Höhe** bietet (z. B. Hügel; Bermen; Senken; Täler; Grate)"
				},
				q_18_2: {
					prompt: "verfügt über **Bodenoberflächen**, die **verschiedene Arten von Spielmöglichkeiten** bieten (z. B. Gras, Asphalt/Beton, Gummi, Splitt, Mulch)"
				},
				q_18_3: {
					prompt: "verfügt über **Anstiege oder Hänge mit weicheren Oberflächen** (z. B. Gras, Sand, Kunstrasen), die ein bequemes Hinunterrutschen/Rollen des Körpers ermöglichen"
				},
				q_18_4: {
					prompt: "verfügt über **Anstiege oder Hänge mit härteren / festen Oberflächen** (z. B. Gummi, Asphalt), die das Hinunterfahren mit rollenden Geräten (z. B. Fahrrad, Roller, Skateboard) oder das Hinunterrutschen (z. B. mit Schlitten, Rutschkreisel, Tube) ermöglichen"
				},
				q_18_5: {
					prompt: "verfügt über **Topografie mit unebenen Oberflächen / Gelände**, die zum Klettern oder Balancieren geeignet sind (z. B. große Felsbrocken; Steinbach; Baumstumpf- oder Steintreppe; Buckel, Holzvorsprünge als Begrenzung, erhöhte Bretter zur Kennzeichnung von Spielbereichen)"
				},
				q_18_6: {
					prompt: "verfügt über Elemente mit **Vertiefungen**, die potenziell Wasser / Schnee / Blätter zum Spielen sammeln können (z. B. Regenrinnen, Bäche, Senken oder konkave Vertiefungen)"
				}
			}
		},
		section_19_novelty: {
			title: "Neuartigkeit",
			description: "???",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der Neuartigkeit dieses Spielbereichs:",
			questions: {
				q_19_1: {
					prompt: "verfügt über Elemente, die **sich entwickelnde Spielmöglichkeiten durch** **wetterabhängige Elemente** bieten (z. B. durch Wind oder Regen aktivierte Klangstäbe oder Trommeln; Senken, die nach Regen vorübergehend Pfützen bilden; trockene Bachläufe, die sich während/nach Niederschlag verändern; Hügel und Hänge, die sich nach Schneefall zum Rutschen/Rodeln eignen)"
				},
				q_19_2: {
					prompt: "verfügt über Elemente, die **sich entwickelnde Spielmöglichkeiten durch jahreszeitliche Veränderungen vor Ort** bieten (z. B. Laubbäume, die ihre Farbe ändern; Bäume, die ihre Blätter/Samen verlieren (z. B. Eicheln); Bäume mit Früchten wie Kastanien/Äpfel; blühende Pflanzen; Teiche, die im Winter zufrieren; Gärten mit saisonalen Früchten und Kräutern)"
				},
				q_19_3: {
					prompt: "verfügt über Elemente, die **Sonnenlicht, wechselndes natürliches Licht und/oder elektronische Beleuchtung nutzen** — und durch lichtreaktive Elemente sensorische und spielerische Möglichkeiten schaffen (z. B. Glasmalerei-Elemente; beleuchtete Elemente; Elemente, die Muster- oder Bewegungsschatten erzeugen)"
				},
				q_19_4: {
					prompt: "verfügt über **interaktive und/oder sensorbasierte Elemente**, die Kinder aktivieren können, um die Spielumgebung zu verändern oder zu gestalten (z. B. materialmischende Elemente wie Wasserpumpen; durch Bewegung oder Timer aktivierte Klang-/Licht-/Wasserelemente)"
				},
				q_19_5: {
					prompt: "verfügt über Elemente, die es Kindern ermöglichen, **unterschiedliche Höhen** zu erleben, einschließlich großer Höhen (z. B. 'großer' Hügel; Turm oder Aussichtspunkt; hohe Rutsche; Kletterwand; bekletterbare Bäume)"
				},
				q_19_6: {
					prompt: "verfügt über interne oder externe **Begrenzungen/Kanten** um Spielbereiche herum **mit integrierten Spielmöglichkeiten** (z. B. bespielbare Hecke; Baumstümpfe/Steine, die einen Spielbereich umrahmen und das Springen/Laufen entlang dieser ermöglichen; interaktive Elemente oder Gucklöcher in Zäunen/ Raumteilern)"
				},
				q_19_7: {
					prompt: "verfügt über Elemente, die **geeignete Wildtiere anlocken** (z. B. blühende Pflanzen, die Insekten anziehen; Vogeltränken, Schmetterlingshäuser oder Insektenhotels; Vertiefungen in Steinen, die zu temporären Vogelbädern werden können; anhebbare Steine, um Käfer und Würmer zu entdecken)"
				},
				q_19_8: {
					prompt: "verfügt über Elemente, die **zum Erkunden anregen oder einladen** (z. B. Räume/Öffnungen zum Hineinschauen oder Dazwischenhinter; Tunnel oder Wege mit versteckten Enden; Guckloch-Elemente; Geräusche/Musik, die zum Entdecken anregen)"
				}
			}
		},
		section_20_sensory_qualities_regulation: {
			title: "Sensorische Qualitäten & Regulation",
			description:
				"Sensorische Qualitäten & Regulation bewertet, wie gut ein Raum vielfältige sensorische Erfahrungen unterstützt, die Engagement, Komfort und Wohlbefinden fördern. Betrachtet werden visuelle, auditive, olfaktorische und taktile Elemente, die Interesse und Anregung schaffen – etwa Farbakzente, unterschiedliche Texturen, Geräusche, angenehme Düfte und interaktive Elemente. Außerdem wird geprüft, ob die Umgebung Möglichkeiten für sensorischen Rückzug oder reduzierte Reize bietet sowie ob anhaltende Lärmbelastung (umgekehrt kodiert) vorhanden ist, um sicherzustellen, dass der Raum Menschen mit unterschiedlichen sensorischen Bedürfnissen unterstützt.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielraum...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen zur Verbesserung der sensorischen Qualitäten dieses Spielraums:",
			questions: {
				q_20_1: {
					prompt: "verfügt über integrierte **Farbe, die visuelles Interesse schafft** (z. B. farbige Spielelemente oder Akzente; Kunst; blühende Pflanzen)"
				},
				q_20_2: {
					prompt: "bietet **weitere Formen visuellen Interesses durch unterschiedliche Muster, Texturen, Licht oder Bewegung** (z. B. Bodenmarkierungen; Spiegel/reflektierende Oberflächen; Skulpturen/künstlerische Elemente; vielfältige Vegetation)"
				},
				q_20_3: {
					prompt: "hat Vegetation, die **angenehme Gerüche** verströmt (z. B. Blumen; Kräuter; obsttragende Pflanzen oder Bäume; Lavendelsträucher; Eukalyptusbäume)"
				},
				q_20_4: {
					prompt: "bietet Möglichkeiten, **Geräusche zu erleben oder zu erzeugen** (z. B. Musikinstrumente; durch Bewegung/Gewicht aktivierte Klangelemente; Windspiele; Sprechrohre; fließendes Wasser; Tiergeräusche; raschelnde Gräser)"
				},
				q_20_5: {
					prompt: "bietet **taktile Erfahrungen durch unterschiedliche Texturen, Materialien und/oder Vibrationen** (z. B. Spiel mit Sand oder Schlamm; weich strukturierte Vegetation; vibrierende Musikelemente)"
				},
				q_20_6: {
					prompt: "hat **Orte zum Rückzug oder zur Abschirmung** von sensorischer Stimulation (z. B. kleine oder geschlossene Räume; naturnahe Bereiche; abgelegene ruhige Bereiche; ruhige/passive Zonen, getrennt von lauten/aktiven Zonen)"
				},
				q_20_7: {
					prompt: "hat **anhaltende Lärmbelastung** (z. B. durch starken Verkehr, Züge oder laute Musik; anhaltende Winde; unvorhersehbare Geräusche) [dieser Punkt muss umgekehrt kodiert werden]"
				}
			}
		},
		section_21_accommodating_diverse_abilities: {
			title: "Berücksichtigung unterschiedlicher Fähigkeiten",
			description:
				"Berücksichtigung unterschiedlicher Fähigkeiten untersucht, wie wirksam ein Spielraum Kinder mit unterschiedlichen körperlichen, sensorischen und kommunikativen Bedürfnissen unterstützt. Im Fokus stehen die Zugänglichkeit und Nutzbarkeit von Spielelementen, Wegen und Übergängen; die Verfügbarkeit von Hilfsmitteln, die Kindern helfen, ihre Bedürfnisse auszudrücken; sowie Gestaltungselemente, die die Teilhabe aus verschiedensten Körperpositionen und mit unterschiedlichen Fähigkeiten ermöglichen.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielraum...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen, um diesen Spielraum für unterschiedliche Altersgruppen und Fähigkeiten zu verbessern.",
			questions: {
				q_21_1: {
					prompt: "verfügt über ausgewiesene **barrierefreie Parkplätze** (für Kraftfahrzeuge und/oder Fahrräder)"
				},
				q_21_2: {
					prompt: "hat **digitale oder analoge Kommunikationsboards*** verfügbar, die Kindern helfen, ihre Bedürfnisse und Wünsche mitzuteilen (das Kommunikationsboard sollte die im Spielraum verfügbaren Spielangebote und Einrichtungen widerspiegeln)* Nicht an JL/TM: möglicherweise umformulieren, versteht jeder „Kommunikationsboard“?"
				},
				q_21_3: {
					prompt: "hat **barrierefreie Kanten oder Zugangspunkte (bündig oder rampenförmig) vom Hauptweg zu barrierefreien Spielflächen oder direkt zu Spielelementen**."
				},
				q_21_4: {
					prompt: "hat **barrierefreie hergestellte Spielelemente, die isoliert** von anderen Spielbereichen oder hinter Zäunen bzw. Sichtbarrieren liegen (z. B. eingezäunte Rollstuhlschaukeln) [muss umgekehrt kodiert werden]"
				},
				q_21_5: {
					prompt: "Spielelemente **unterstützen das Hinauf- und Hinunterwechseln** (z. B. Ein-/Auffahrrampen; ausreichend Platz und/oder Plattformen zum Umsetzen von einem Mobilitätsgerät; Rutschen mit verlängertem Auslauf am Ende für ein einfaches Umsetzen)"
				},
				q_21_6: {
					prompt: "Spielelemente verfügen über **Handläufe und Griffe zur Unterstützung beim Wechseln** **und für Stabilität**, die für Kinder mit unterschiedlichen Fähigkeiten leicht zu benutzen sind (z. B. in unterschiedlichen Höhen angebracht; in Größen und Formen, die für unterschiedlich große Hände geeignet sind)"
				},
				q_21_7: {
					prompt: "Spielelemente ermöglichen die **Nutzung aus unterschiedlichen Körperpositionen** und bieten angemessene Unterstützung für Kinder mit verschiedenen Bedürfnissen (z. B. Optionen zum Sitzen, Stehen oder Liegen; Sitze oder Schaukeln mit Ganzkörperstütze, breiten Basen und/oder sicheren Gurten; Fußstützen, damit die Füße nicht baumeln müssen)"
				},
				q_21_8: {
					prompt: 'verfügt über **barrierefreien Zugang zu den höchsten Punkten** und/oder zu den "coolsten" oder einzigartigsten Spielelementen'
				},
				q_21_9: {
					prompt: "hat klare,** taktile und/oder visuelle Hinweise** (z. B. Farbkontraste, Materialwechsel oder strukturierte/gepunktete Oberflächen, niedrig erhabene Begrenzungen), um Kanten von Wegen zu definieren oder signifikante Höhenänderungen (z. B. Kanten einer erhöhten Plattform) bzw. Übergänge in neue Bereiche (z. B. zu den Schaukeln) zu signalisieren"
				}
			}
		},
		section_22_playspace_suitability_for_diverse_users: {
			title: "Eignung des Spielbereichs für unterschiedliche Nutzergruppen",
			description:
				"Die Eignung des Spielbereichs für unterschiedliche Nutzergruppen bewertet, wie gut der Spielbereich darauf ausgelegt ist, die Bedürfnisse von Kindern unterschiedlichen Alters und mit verschiedenen Fähigkeiten zu erfüllen.",
			instruction: "Lesen Sie jede Aussage und beantworten Sie die Fragen. Dieser Spielbereich...",
			notesPrompt:
				"Anmerkungen? Beschreiben Sie eine oder mehrere Empfehlungen, um diesen Spielbereich für unterschiedliche Altersgruppen und Fähigkeiten zu verbessern.",
			questions: {
				q_22_1: {
					prompt: "erfüllt die Bedürfnisse von **Kindern im Alter von 0 bis 5 Jahren**"
				},
				q_22_2: {
					prompt: "erfüllt die Bedürfnisse von **Kindern im Alter von 6 bis 12 Jahren**"
				},
				q_22_3: {
					prompt: "erfüllt die Bedürfnisse von **Kindern ab 13 Jahren**"
				},
				q_22_4: {
					prompt: "erfüllt die Bedürfnisse von **Kindern mit körperlichen Beeinträchtigungen** (z. B. Kinder, die Mobilitätshilfen wie Gehhilfen und Rollstühle nutzen, Kinder mit eingeschränkter Muskelkraft, ...) "
				},
				q_22_5: {
					prompt: "erfüllt die Bedürfnisse von **Kindern mit Sehbeeinträchtigungen, einschließlich Blindheit und Sehschwäche**."
				},
				q_22_6: {
					prompt: "erfüllt die Bedürfnisse von **Kindern, die taub oder schwerhörig sind** (z. B. Kinder, die Hörhilfen oder Implantate nutzen, Kinder mit Hörverlust)."
				},
				q_22_7: {
					prompt: "erfüllt die Bedürfnisse von **Kindern mit intellektuellen und entwicklungsbedingten Beeinträchtigungen** (z. B. Unterstützungsbedarf beim Lernen oder bei kognitiven Fähigkeiten)."
				}
			}
		}
	}
} satisfies InstrumentTranslations;
