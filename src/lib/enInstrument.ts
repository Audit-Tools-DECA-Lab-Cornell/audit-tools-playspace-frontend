import type { InstrumentTranslations } from "@/lib/instrument-translations";

export const enInstrumentTranslations: InstrumentTranslations = {
	metadata: {
		instrumentName: "Playspace Play Value and Usability Audit Tool",
		currentSheet: "PVUA v5.2"
	},
	preamble: [
		"## How the tool is structured\nThe Playspace Play Value and Usability Audit tool is structured in 22 domains. Each domain has between 2 and 12 items. All items represent specific features or characteristics of the environment.",
		"Each item is assessed through up to four scales: Provision, Diversity, Challenge Opportunities, and Sociability Support. Not all items include every scale.",
		"### 1. Provision\nProvision is always answered first. When the provision answer is a zero-like response such as No or Not applicable, the remaining scales stay hidden because they do not apply.",
		"### 2. Diversity\nDiversity evaluates whether the provided items offer a variety of types, forms, or opportunities. In other words, whether they are not all the same.\n\n**Guiding question:** To what extent is diversity in this feature/environmental characteristic considered?\n\nExample: For 5 swings: Are they all different types (e.g. large swing, baby swing, basket swing, rope swing), or are they all identical?\n\n**It is your judgment to indicate if there is No diversity, Some diversity or A lot of diversity considered. You can only choose one!**",
		"### 3. Challenge opportunities\nChallenge opportunities assess whether the feature provides opportunities with different levels of difficulty.\n\n**Guiding question:** To what extent does this feature/environmental characteristic offer different levels of challenge?\n\nExample: The swings provided should be examined and judged if they provide increasing challenging opportunities.\n\n**It is your judgment to indicate if the provided swings offer different levels of difficulty. You can only choose one!**",
		"### 4. Sociability support\nSociability support assesses whether more than one child/person can use this feature/environmental characteristic together. It considers whether the feature can be used by more than one person at once, individually, in small groups, or in larger groups.\n\n**Guiding question:** Can more than one child (or person) use this feature together?\n\nExample: Can some of the swings be used alone? Can some be used in pairs? Can some be used in groups of children?\n\n**It is your judgment to indicate if they can be used alone, in pairs or in groups.**",
		"## Open reflection\nThe open question gives you the possibility to write down some reflections. A guiding question will ask you to describe one or two aspects you recommend changing in the playspace to increase its play value and usability.",
		"## Two parts of the audit\nThe Playspace Play Value and Usability Audit tool uses two methods for assessing a playspace:\n\n- **(A) Onsite Audit of the Physical Environment**\nThis part of the audit assesses aspects of the playspace that can only be examined onsite in the physical environment.\nIt requires being physically present at the playspace.\n\n- **(B) Survey of Ecological Aspects of the Playspace**\nThis part of the audit assesses information related to the history, management practices, and how weather and seasons influence playspace use.\nIt does not require being onsite.\nIt must be answered by someone familiar with the playspace's background and context.",
		"## Before you continue\nBefore moving to the next section, you must decide which part(s) of the audit you will complete: A, B, or A & B.\n\nYour choice depends on how familiar you are with the playspace and what role you have."
	],
	executionModes: {
		both: {
			label: "I am very familiar with the playspace and I am onsite.",
			description: "Answer both the survey and the onsite audit items."
		},
		survey: {
			label: "I am very familiar with the playspace but I am not onsite.",
			description: "Answer only the survey items."
		},
		audit: {
			label: "I am not familiar with the playspace but I am onsite.",
			description: "Answer only the onsite audit items."
		}
	},
	preAuditQuestions: {
		audit_date: {
			label: "Date of the audit",
			description: "Automatically generated when the audit session is created.",
			options: {}
		},
		started_at: {
			label: "Start time of the audit",
			description: "Automatically generated when the audit session is created.",
			options: {}
		},
		submitted_at: {
			label: "Finish time of the audit",
			description: "Automatically generated when the audit is submitted.",
			options: {}
		},
		total_minutes: {
			label: "Total time in minutes",
			description: "Automatically calculated from the start and finish timestamps.",
			options: {}
		},
		season: {
			label: "Current season",
			description: null,
			options: {
				spring: {
					label: "Spring",
					description: null
				},
				summer: {
					label: "Summer",
					description: null
				},
				autumn: {
					label: "Autumn",
					description: null
				},
				winter: {
					label: "Winter",
					description: null
				}
			}
		},
		weather_conditions: {
			label: "Weather condition at the time of the audit",
			description: null,
			options: {
				sunshine: {
					label: "Sunshine",
					description: null
				},
				cloudy: {
					label: "Cloudy",
					description: null
				},
				windy: {
					label: "Windy",
					description: null
				},
				inclement_weather: {
					label: "Inclement weather",
					description: null
				}
			}
		},
		users_present: {
			label: "Users on the playspace at the time of the audit",
			description: null,
			options: {
				none: {
					label: "None",
					description: null
				},
				children: {
					label: "Children",
					description: null
				},
				adults: {
					label: "Adults",
					description: null
				}
			}
		},
		user_count: {
			label: "Amount of users",
			description: null,
			options: {
				none: {
					label: "None",
					description: null
				},
				some: {
					label: "Some",
					description: null
				},
				a_lot: {
					label: "A lot",
					description: null
				}
			}
		},
		age_groups: {
			label: "Estimated children age groups using the playspace",
			description: null,
			options: {
				under_5: {
					label: "Under 5 years",
					description: null
				},
				age_6_10: {
					label: "6-10 year olds",
					description: null
				},
				age_11_plus: {
					label: "10+ year olds",
					description: null
				}
			}
		},
		place_size: {
			label: "Size of the playspace based on your estimate",
			description: null,
			options: {
				small: {
					label: "Small",
					description: null
				},
				medium: {
					label: "Medium",
					description: null
				},
				large: {
					label: "Large",
					description: null
				}
			}
		}
	},
	scales: {
		quantity: {
			title: "Quantity",
			prompt: "In what quantity is this feature or environmental characteristic considered?",
			description:
				"Quantity refers to how many of a specific provision or environmental characteristic are available.",
			options: {
				no: {
					label: "No"
				},
				some: {
					label: "Some"
				},
				a_lot: {
					label: "A lot"
				},
				not_applicable: {
					label: "Not applicable"
				}
			}
		},
		diversity: {
			title: "Diversity",
			prompt: "To what extent is diversity in this feature or environmental characteristic considered?",
			description: "Diversity evaluates whether the provided items offer variety rather than all being the same.",
			options: {
				not_applicable: {
					label: "Not applicable"
				},
				no_diversity: {
					label: "No Diversity"
				},
				some_diversity: {
					label: "Some Diversity"
				},
				a_lot_of_diversity: {
					label: "A lot of Diversity"
				}
			}
		},
		sociability: {
			title: "Sociability",
			prompt: "Can more than one child or person use this feature together?",
			description: "Sociability considers whether the feature can be used alone, in pairs, or in larger groups.",
			options: {
				not_applicable: {
					label: "Not applicable"
				},
				no: {
					label: "No"
				},
				yes_a_pair: {
					label: "Yes - a pair"
				},
				yes_more_than_two_children: {
					label: "Yes - more than two children"
				}
			}
		},
		challenge: {
			title: "Challenge",
			prompt: "To what extent does this feature or environmental characteristic provide different levels of challenge?",
			description:
				"Challenge assesses whether the feature provides opportunities with different levels of difficulty.",
			options: {
				not_applicable: {
					label: "Not applicable"
				},
				no_challenge: {
					label: "No Challenge"
				},
				some_challenge: {
					label: "Some Challenge"
				},
				a_lot_of_challenge: {
					label: "A lot of Challenge"
				}
			}
		}
	},
	sections: {
		section_1_playspace_character_community: {
			title: "Playspace Character & Community",
			description:
				"Playspace Character & Community describes aspects of a playspace that offers opportunities for users to connect with the playground. These aspects relate to local history/heritage/art/stories, community events hosted on the playspace and aspects how and for whom the playspace was designed for.",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the character and community involvment of this playspace:",
			questions: {
				q_1_1: {
					prompt: "was **developed or designed with the involvement of users** of the playspace (e.g. children; parents; community organizations)"
				},
				q_1_2: {
					prompt: "was **developed or designed specifically** to provide play opportunities** for one or more known underserved population** such as  girls, minorities, or children with diverse needs"
				},
				q_1_3: {
					prompt: "** reflects cultural and historical aspects of the community** (e.g., local art/stories/heritage is represented; locally sourced materials are used)"
				},
				q_1_4: {
					prompt: "**has** **unique or novel aspects/opportunities** that distinguish it from other playspaces (e.g., highly naturalized playground; spaces or features that can be shaped and manipulated by children; sculptural play features)"
				},
				q_1_5: {
					prompt: "**is** **staffed by adults** **who  are actively facilitating children's play** (e.g. providing new opportunities in the environment for new /changing forms of play)"
				},
				q_1_6: {
					prompt: "** involves users** of the playground (children and/or adults) **in maintenance activities** (e.g., in landscaping, painting; assigns adults living nearby to keep an eye on the playspace)"
				},
				q_1_7: {
					prompt: "**hosts community events**"
				}
			}
		},
		section_2_playspace_location_connectivity: {
			title: "Playspace Location & Connectivity",
			description:
				"Playspace Location & Connectivity about how the playspace is integrated into the locality, if other play and leisure opportunities are available, as well as how users access the playspace.",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the location and connectivity of this playspace:",
			questions: {
				q_2_1: {
					prompt: "is **accessible by walking or biking paths **"
				},
				q_2_2: {
					prompt: "is **accessible through public transport **(e.g., there is a public transit stop at or near at least one entrance)"
				},
				q_2_3: {
					prompt: "is **located near to a residential area** (within 10 min walk)"
				},
				q_2_4: {
					prompt: "is** located near to schools and/or childcare facilities **(within 10 min walk)"
				},
				q_2_5: {
					prompt: "is **located near to or co-located with other public opportunities** that might be interesting/important to children and families (e.g., park space; community centre; library; amenities; community gathering places; museums; community garden; nature areas; coffee shop)"
				},
				q_2_6: {
					prompt: "is **embedded in or connected to a larger naturalized space** (e.g. forest; woodland; large garden; conservation area)"
				},
				q_2_7: {
					prompt: "is **located directly adjacent to roads with heavy or fast traffic** without clear/safe crossing options [Note this item needs to be reversed scored]"
				}
			}
		},
		section_3_playspace_rules_restrictions: {
			title: "Playspace Rules & Restrictions",
			description: "Playspace Rules & Restrictions evaluates if any rules and restrictions hinder outdoor play.",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the rules and restrictions of this playsapace:",
			questions: {
				q_3_1: {
					prompt: "**restricts certain age groups** from the playspace (e.g., older children, teens)  [This item need to be reversed scored]"
				},
				q_3_2: {
					prompt: "**restricts certain kinds of play or behaviour** (e.g., being loud, ball play; using wheeled play equipment or sleds)  [This item need to be reversed scored]"
				},
				q_3_3: {
					prompt: "**restricts children’s access by requiring adult supervision** (i.e., caregiver supervision is not mandatory, except perhaps for very young children; children can independently use the playspace)  [This item need to be reversed scored]"
				}
			}
		},
		section_4_playspace_information_wayfinding: {
			title: "Playspace Information & Wayfinding",
			description:
				"Playsapce Information and Wayfinding provide orientation on the playspace, information about how to navigate through playspace and/or guidelines about what to do or how to use the playground.",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the information and wayfinding of this playspace:",
			questions: {
				q_4_1: {
					prompt: "has **online information** related to playspace use and features (e.g., opening hours, accessibility, transit options, parking)"
				},
				q_4_2: {
					prompt: "has a **layout that is easy to navigate** (e.g. clear logical primary route from entry to exit; clearly defined play zones)"
				},
				q_4_3: {
					prompt: "has **accessible maps and/or signage ****at entrances** to the playspace that provide navigation and usage guidance  (e.g. positioned at an accessible height for wheelchair users; uses Braille text, pictographs and/or high colour contrast; info available via QR code ) a"
				},
				q_4_4: {
					prompt: "has **child-friendly, easy to read/understand maps and/or signage ****at entrances** (e.g. positioned at a  height suitable for young children; uses simple language, symbols, and/or images)"
				},
				q_4_5: {
					prompt: "has **accessible maps and/or signage ****distributed around the playspace** that provide navigation  and usage guidance  (e.g. positioned at an accessible height for wheelchair users; uses Braille text, pictographs and/or high colour contrast; info available via QR code ) a"
				},
				q_4_6: {
					prompt: "has **child-friendly, easy to read/understand maps and/or signage ****distributed around the playspace** (e.g. positioned at a  height suitable for young children; uses simple language, symbols, and/or images)a"
				}
			}
		},
		section_5_management_maintenance: {
			title: "Management & Maintenance",
			description:
				"Management and maintenance describe considerations that cater for safe and playable environment.",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the management and maintenance of this playspace:",
			questions: {
				q_5_1: {
					prompt: "has an **up-to-date safety certificate **for play equipment and/or surfaces"
				},
				q_5_2: {
					prompt: "is **generally in good repair**, with few to no visible hazards such as broken or damaged equipment/surfacing, remnants from removed equipment, rotten or rough wood, peeling paint"
				},
				q_5_3: {
					prompt: "is **mostly clean** and well-kept (e.g. little/no graffiti, cigarette butts, litter or other dangerous debris such as such as broken glass, syringes, animal feces, overgrown plants)"
				},
				q_5_4: {
					prompt: "has** sufficient litter bins** in relation to the size of the playspace and in relevant areas (e.g., at/near entry points; by table/seating areas)"
				},
				q_5_5: {
					prompt: "has **pervasive unpleasant smells**, including in enclosed spaces (e.g. from animal feces, smoke, and/or garbage)  [This item need to be reversed scored]"
				},
				q_5_6: {
					prompt: "has **a storage area** for loose parts and/or ride-on equipment"
				},
				q_5_7: {
					prompt: "is **landscaped and maintained in a way that provides novel opportunities for play **(e.g., tunnels are cut into vegetation; low branches and boulders are left to climb on; has no-mow areas; fallen leaves/flowers/small branches are intentionally left for play; vegetation is not overly pruned)"
				}
			}
		},
		section_6_climate_protection_adaptability: {
			title: "Climate Protection & Adaptability",
			description: "??",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the pathways of this playspaces:",
			questions: {
				q_6_1: {
					prompt: "provides **shade or shelter** **to most seating areas** at some point during the day"
				},
				q_6_2: {
					prompt: "provides **shade or shelter from sun/inclement weather in most primary play areas **at some point during the day (e.g. through trees/vegetation; buildings; shade structures or canopies; positioning of equipment)."
				},
				q_6_3: {
					prompt: "is designed and/or maintained to provide protection from inclement weather/sun/wind through **placement of features and/or landscaping** (e.g. wind screen provided by evergreen planting)"
				},
				q_6_4: {
					prompt: "has **appropriate lighting for the geographic location and local conditions** to ensure feelings of safety and to extend play times (e.g., lighting suitable for winter months ,evenings or changing weather conditions, and/or lit paths into the playspace)"
				},
				q_6_5: {
					prompt: "has **appropriate drainage** that prevents flooding or large amounts of standing/stagnant water"
				}
			}
		},
		section_7_boundaries_entrances: {
			title: "Boundaries & Entrances",
			description:
				"Boundaries & Entrances considers entry to and separation of playspaces. Boundaries are defined as clear borders that illustrate the edges of an area or define distinct activity zones - these can include fences, walls or hedgerows. Entrances are defined as the locations where people enter/exit playspaces or activity zones - these can be formal (e.g., gates) or informal (e.g., openings in boundaries or changes in ground surface).",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the pathways of this playspaces:",
			questions: {
				q_7_1: {
					prompt: "has fences/boundaries **to separate play areas from significant hazards** such as road traffic or deep water"
				},
				q_7_2: {
					prompt: "has fences/boundaries **that are** **visually permeable**, allowing for easy observation/supervision into adjacent spaces"
				},
				q_7_3: {
					prompt: "any **gates can be easily opened by adults** (including those with limited grip strength or from a wheelchair/mobility device)"
				},
				q_7_4: {
					prompt: "any **areas enclosed by full heigh**t boundaries/fencing have more than one entrance/exit"
				}
			}
		},
		section_8_pathways: {
			title: "Pathways",
			description: "??",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the pathways of this playspaces:",
			questions: {
				q_8_1: {
					prompt: "has primary paths that **provide diverse ride/run/walk experiences** (e.g. straight and winding paths or loops; paths with waves or bumps; paths that go through tunnels or gardens/wooded areas)"
				},
				q_8_2: {
					prompt: "has primary paths leading to each play area / feature that are **solid and level surfaced**, affording all users to walk/run/ride on (including mobility devices)"
				},
				q_8_3: {
					prompt: "has paths that are **wide enough for at least 2 people** to ride/run/walk side by side"
				},
				q_8_4: {
					prompt: "has secondary paths that provide **novel play routes **(e.g. lined up stumps; stepping stones through a garden or creek; play route through a willow tunnel or a play structure; a path mown in tall grass; a tunnel under a hill or berm; sensory-surface path)"
				}
			}
		},
		section_9_open_space: {
			title: "Open Space",
			description:
				"An open space is defined as an integrated area within or surrounding the playsapace with no play features, other built structures and no planting. Open spaces are multipurpose areas and are used flexibly, affording a diversity of opportunities such as running, walking, loose parts play (balls, hula hoops or natural elements and others), sitting or relaxing, picnics, playing in groups, …",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the open spaces of this playspace:",
			questions: {
				q_9_1: {
					prompt: "has** open, mostly flat spaces** (with little to no incline) that afford diverse play such as ball or sports play, group games or gathering"
				},
				q_9_2: {
					prompt: "a portion of flat, open spaces have** accessible surfaces**, allowing wheeled devices such as wheelchairs or scooters to be used"
				}
			}
		},
		section_10_enclosed_bounded_spaces: {
			title: "Enclosed & Bounded Spaces",
			description:
				"Enclosed & Bounded Spaces are defined by a clear boundary and are fully or partly enclosed. These are found in the natural and built environment. Examples include nooks, crannies, low raised boundaries framing a smaller space, play huts, dens, elevated above ground small spaces, ...). Enclosed & Bounded Spaces afford children to be by themselves, be with a small group of children to socialize, experience hiding, and being away from adults or feeling away from adult eyes. Enclosed & Bounded Spaces may afford creative and imaginative play.",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the enclosed and bounded spaces of this playspace:",
			questions: {
				q_10_1: {
					prompt: "has enclosed or bounded spaces that afford **a sense of enclosure** (e.g., house-like, room-like) or **that are fully enclosed** (e.g., playhouses; huts or dens; tree houses; enclosed small spaces formed by or under trees/shrubs, enclosed and bounded sapces which are elevated and on ground level)"
				},
				q_10_2: {
					prompt: "has  enclosed or bounded spaces that also **afford the opportunity to look out from and observe** without being overly visible from the outside (e.g. playhouse with small windows; boat feature with portholes; grass hut with small door opening)"
				},
				q_10_3: {
					prompt: "has **low raised boundaries / edges that define smaller spaces** (e.g., small niches; nooks; corners; sub-divided sand pits)"
				}
			}
		},
		section_11_sport_game_spaces: {
			title: "Sport & Game Spaces",
			description:
				"Sport & Game Spaces are defined areas that afford children a certain kind of play, such as soccer, basketball, and (table) tennis. These sport and game areas are sometimes separate from the playground. If sports areas are close or incorporated into the playsapace, include them in the audit.",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the sport and game spaces of this playspace:",
			questions: {
				q_11_1: {
					prompt: "has **spaces that can support sports or games** (e.g. soccer fields, basketball  or tennis courts; table tennis; pavement games)"
				},
				q_11_2: {
					prompt: "has sport/game spaces with **surfaces**** ****that are suitable for intended activities** (e.g. flat, open grass or pavement areas for soccer or basketball)"
				},
				q_11_3: {
					prompt: "has sport/game spaces that have **suitable equipment or markings** for the activity (e.g.  goal posts; basketball hoops & nets; surface markings for four square or hopscotch)"
				}
			}
		},
		section_12_manufactured_play_features: {
			title: "Manufactured Play Features",
			description:
				"Manufactured Play Features are featuers manifactured for play sometimes called play equipment or play components. These might be manifactured from diverse materials including plastic, matel or wood.",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the manifactured play features of this playspace:",
			questions: {
				q_12_1: {
					prompt: "has **un-prescribed or loosely shaped play structures/features that afford children opportunities to unfold their own play ideas** (e.g., just a frame; ambiguous structures; sculptural elements; themed play structures or features)"
				},
				q_12_2: {
					prompt: "has manufactured play features which afford **sliding** opportunities (e.g. open slide, enclosed slide,  pipe slide, fire pole, zip wire, roller slide,...)"
				},
				q_12_3: {
					prompt: "has manufactured play features which afford **climbing, dangling, and/or pulling one's self up**  (e.g. gymnastic rings; pull up bar; rock wall; climbing frame; ladder)"
				},
				q_12_4: {
					prompt: "has manufactured play features which afford **turning/spinning** (e.g.spinners; merry-go-round; twisty slide; swings that can spin)"
				},
				q_12_5: {
					prompt: "has manufactured play features which afford **balancing  **on or across (e.g. balance beam or logs; wobble board; shaky bridges; balancing ropes; narrow platforms)"
				},
				q_12_6: {
					prompt: "has manufactured play features which afford **rocking** (e.g. a teetertotter/see saw; spring rocker)"
				},
				q_12_7: {
					prompt: "has manufactured play features which afford **crawling **in, on or through  (e.g. crawling net; tunnel)"
				},
				q_12_8: {
					prompt: "has manufactured play features which afford **bouncing or jumping on/of**f (e.g. trampoline; podium; parkour elements)"
				},
				q_12_9: {
					prompt: "has manufactured play features which afford ** manipulation by pushing, sliding, turning, opening and/or closing things** (e.g steering wheel; operable windows or doors; play panel; pump; pulley; musical/sound equipment)"
				},
				q_12_11: {
					prompt: "has manufactured play features **oriented and/or connected in ways that afford play routes** across one or more features (e.g. an embedded obstacle course; features placed close enough together to facilitate play across multiple features)"
				},
				q_12_12: {
					prompt: "has **multiple ways on/off any large play structures** (e.g., ramps; steps; climbing net/wall; embankment access)"
				}
			}
		},
		section_13_natural_play_features: {
			title: "Natural Play Features",
			description:
				"Natural Play Features can either be located in the playspace or surrounding the playspace. Natural environments include vegetation, shrubs, high grass, areas with trees, bushes, boulders, and rocks. Natural features afford a variety of play opportunities, including physical active play (e.g.,, climbing), exploring, sensory play, manipulating, and creating their own play (e.g.,, socio-dramatic play or imagination), resting, being alone, or gathering with other children.",
			instruction:
				"Important: Your r audit focuses on the natural play features provided and ment for play. Not the features to make the space look natural (e.g. trees that only are for shade but not climbing). Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the natural play featuers of this playspace:",
			questions: {
				q_13_1: {
					prompt: "has **large-scale vegetation** appropriate and accessible for play (e.g. trees; large shrubs / hedges, not to much cut of branches on trees)"
				},
				q_13_2: {
					prompt: "has** small-scale vegetation** appropriate and accessible for play (e.g. smaller shrubs / hedges; long grasses; flower beds with pathways; no-mow area)"
				},
				q_13_3: {
					prompt: 'has **denser or taller vegetation** that afford playful hiding in/under, or finding a "secret place" or  the sense of exploring or getting "lost" (e.g. long grass maze; low hanging canopies; dense hedges; leafy climbing tree)'
				},
				q_13_4: {
					prompt: "has **fixed natural features **that afford climbing, sitting on,  jumping from etc (e.g. medium to large boulders, fallen trees/logs)"
				}
			}
		},
		section_14_loose_manufactured_parts_equipment: {
			title: "Loose Manufactured Parts & Equipment",
			description:
				"Loose Manufactured Parts & Equipment are human made play objects, sometimes provided in the playground but sometimes brought to the playground (e.g. loosely shaped loose parts, go-carts, scooter, bikes, balls/frisbees or other toys, sand/mud/water play toys)",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the loose manifactured parts and equipment of this playspace:",
			questions: {
				q_14_1: {
					prompt: "has **small manufactured loose parts** available that are **light and easy to move/handle**, including those that can be used to manipulate malleable materials and other loose parts (e.g. cups; buckets; shovels; small tools; funnels; balls; light ropes; fabrics; balls; frisbees' hula hoops; rackets; toy cars/boats; puppets)"
				},
				q_14_2: {
					prompt: "has **medium-sized manufactured loose parts** that are a **bit heavier but still relatively easy to move/handle** (e.g. boxes; crates; construction cones; pots and pans; plastic tubes/PVC pipes; larger building blocks; tools; larger shovels/rakes; heavy ropes)"
				},
				q_14_3: {
					prompt: "has **large manufactured loose parts** that are **heavier and may require help to move/handle** (e.g., tires; tree stumps; large blocks or planks; tables or chairs; movable climbers)"
				},
				q_14_4: {
					prompt: "has **(wheeled) ride-on equipment** available that children can use to move around the space / paths (e.g. scooters, bicycles or tricycles, buggies, skateboards, sled/toboggan)"
				}
			}
		},
		section_15_loose_natural_parts_malleable_materials: {
			title: "Loose Natural Parts & Malleable Materials",
			description:
				"Loose Natural Parts & Malleable Materials include materials like earth, mud, sand, water or any natural parts like leaves, flowers, sticks, stones, cones, and others. Natural loose parts afford children to collect, arrange, create, built, dig, mix, explore, and are used them in socio-dramatic and creative play. Materials afford sensory opportunities and to mixing, digging, transporting, filling and emptying, building, …",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the loose natrual parts and malleable materials of this playspace:",
			questions: {
				q_15_1: {
					prompt: "has **natural malleable materials availiable **(e.g. sand, gravel/pebbles, mulch, earth, mud, water, snow)"
				},
				q_15_2: {
					prompt: "in spaces where malleable materials are availiable there are **natural or manufactured loose parts present** (e.g. buckets/shovels or sticks in sand areas; pots, bowls and spoons in mud area/kitchen)"
				},
				q_15_3: {
					prompt: "has **small natural loose parts availiable** (or provided in some season) that are light and easy to move/handle (e.g. leaves; bark/mulch pinecones; seeds; sticks or small branches; fruits; shells; flowers, snowballs)"
				},
				q_15_4: {
					prompt: "has  **medium-sized natural loose parts that are a bit heavier** but still relatively easy to move/handle  (e.g. tree cookies; palm-sized rocks; small stumps; larger banches; ice chunks)"
				},
				q_15_5: {
					prompt: "has **larger natural loose parts  that are heavier** and may require help to move/handle (e.g.  wood logs; large branches; heavier rocks; large tree stumps)"
				},
				q_15_6: {
					prompt: "children are **allowed to** **use loose parts and/or malleable material together and/o**r **move them from one play zone to another**"
				}
			}
		},
		section_16_seating: {
			title: "Seating",
			description:
				"Seating is a supporting feature of playgrounds. More formal seating might be used more by adults who want to supervise children. More informal seating might be used by children for resting, sitting, observing others, linger or socialize with peers but also afford evolving of creative and imaginative play (examples of informal seating: platforms, tree logs, stumps, steps, low raised boundaries, rocks, picknick tables, seating in smaller spaces and in nature …)",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt: "Any comments? Describe one or more recommendations to improve seating of this playspace:",
			questions: {
				q_16_1: {
					prompt: "provides opportunities to sit through** formal seating** (e.g. chairs; benches; stools; picnic tables)** and/or informal seating** (e.g. platforms/ledges; tree stumps; tree logs; boulders, low raised walls)"
				},
				q_16_2: {
					prompt: "seating is available within or **on the edges of primary play areas for easy observation** (by caregivers or other children)"
				},
				q_16_3: {
					prompt: "seating is **dispersed throughout playspace** (e.g. in small spaces; in natural areas; within play structures or features)"
				},
				q_16_4: {
					prompt: "there is seating that provides opportunities to** sit and gather in small and larger groups** (e.g. 2-3 person bench; amphitheater; pavilion; picnic tables)"
				},
				q_16_5: {
					prompt: "there is **seating designed to increase social interactions **(e.g., circular arrangement; arranged facing each other in close proximity; picnic table, amphytheater) *need more examples?"
				},
				q_16_6: {
					prompt: "has **accessible tables and/or seating** (e.g. seats with backrests and/or armrests; space under tables for wheelchairs; affords transfer from mobility device to seating; solid surfacing adjacent to other seating for mobility devices/stroller)"
				},
				q_16_7: {
					prompt: "there are **manufactured play features which afford laying or sitting on** (e.g. comfortable net; hammock; integrated seating in structure; platforms)"
				}
			}
		},
		section_17_amenities: {
			title: "Amenities",
			description:
				"Amenities are supporting features of a playground, contributing to making the playground more attractive and comfortable especially families, children with disabilities, girls).",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the amenitites of this playspace:",
			questions: {
				q_17_1: {
					prompt: "has **clean, regularly-maintained restrooms** that are free and open to the public during playspace hours"
				},
				q_17_2: {
					prompt: "has a least** one restroom** (in each gender block, if separated) that is **accessible** and suitable for all users (e.g. for those using mobility devices; big enough to fit two people; has changing table for babies and/or adults with transfer system)"
				},
				q_17_3: {
					prompt: "has** drinking water fountains** or filling stations that are intuitive to operate, provided at accessible height or/at variety of heights, on an accessible surface"
				}
			}
		},
		section_18_topography_surfaces: {
			title: "Topography & Surfaces",
			description:
				"Topography & Surfaces are identified as hills, slopes, depressions, and steps in the terrain. They affords a variety of play such as running, rolling down, rolling things down, driving, climbing, balancing, sledding, sliding, enjoyment of an outlook and experience hights, jumping/diving/rolling in/over puddles, …)",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve this playspace's topography and surfaces:",
			questions: {
				q_18_1: {
					prompt: "has** topography** that provides **differences in slope, incline, and/or height** (e.g. hills; berms; dips; valleys; ridges)"
				},
				q_18_2: {
					prompt: "has** ground surfaces** that afford **different types of play opportuntites** (e.g. grass, asphalt/concrete, rubber, pea gravel, mulch)"
				},
				q_18_3: {
					prompt: "has **inclines or slopes with softer surfaces** (e.g. grass, sand, turf) that afford comfortably sliding/rolling your body down"
				},
				q_18_4: {
					prompt: "has** inclines or slopes with harder / compact surfaces** (e.g. rubber, asphalt) that afford riding down on wheeled equipment (e.g. bicycle, scooter, skateboard) or sliding down on (e.g. using sled, saucer, tube)"
				},
				q_18_5: {
					prompt: "has **topography that provides uneven surfaces / terrain** to climb or balance across (e.g. large boulders; stone creek; stump or stone staircase; moguls, wood ledges as boundaries, raised boardes indicating playspace zones)"
				},
				q_18_6: {
					prompt: "has features that provide** depressions** that could potentially collect water / snow / leaves for play (e.g. rain channels, creeks, dips, or concave depressions)"
				}
			}
		},
		section_19_novelty: {
			title: "Novelty",
			description: "???",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt: "Any comments? Describe one or more recommendations to improve the novelty of this playspace:",
			questions: {
				q_19_1: {
					prompt: "has features that provide** evolving play opportunities due to** **weather-responsive elements **(e.g., chimes or drums activated by wind or rain; dips that create temporary puddles after rainfall; dry creek beds that change during/after precipitation; hills and slopes suitable for sliding/sledding after snowfall)"
				},
				q_19_2: {
					prompt: "has features that provide** evolving play opportunities due to local seasonal changes** (e.g., leafy trees that change colors; trees that lose their leaves/seeds (e.g. acorns); fruit-bearing trees such as chestnuts/apples; flowering plants; ponds that freeze in winter; gardens with seasonal fruits and herbs)"
				},
				q_19_3: {
					prompt: "has features that **make use of sunlight, changing natural light, and/or electronic lighting**—creating sensory and play opportunitites through light responive features (e.g. stained-glass panels; illuminated features; features that create patterned or moving shadows)"
				},
				q_19_4: {
					prompt: "has** interactive and/or sensor-based features** that children can activate to change or shape the play environment (e.g., material-mixing elements like water pumps; motion or timer activated sound/light/water features)"
				},
				q_19_5: {
					prompt: "has features that allow children to **experience different heights**, including great heights (e.g. 'large' hill; tower or lookout; tall slide; climbing wall; climbable trees)"
				},
				q_19_6: {
					prompt: "has internal or external** boundaries/edges** around play areas **with embedded play opportuntites** (e.g. playable hedge; stumps/rocks wrapping around a play area affording jumping/running along; interactive features or peek-a-boo openings in fences/space dividers)"
				},
				q_19_7: {
					prompt: "has features that **attract appropriate wildlife** (e.g. flowering plants that attract insects; bird feeders, butterfly houses, or bug hotels; depressions in rocks that can become temporary bird baths; liftable stones to find bugs and worms)"
				},
				q_19_8: {
					prompt: "has features that **trigger or invite exploration** (e.g. spaces/openings to look into or behind; tunnels or paths with hidden endings; peek-a-boo elements; sound/music that encourages discovery)"
				}
			}
		},
		section_20_sensory_qualities_regulation: {
			title: "Sensory Qualities & Regulation",
			description:
				"Sensory Qualities & Regulation evaluates how well a space supports diverse sensory experiences that enhance engagement, comfort, and well‑being. It considers the presence of visual, auditory, olfactory, and tactile elements that create interest and stimulation—such as color accents, varied textures, sounds, pleasant smells, and interactive features. It also assesses whether the environment offers options for sensory retreat or reduced stimulation, as well as any persistent noise pollution (reverse‑coded), to ensure the space is supportive for individuals with varying sensory needs.",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve the sensory qualitites of this playspace:",
			questions: {
				q_20_1: {
					prompt: "has integrated **color in ways that creates visual interest** (e.g. colored play features or accents; art; flowering plants)"
				},
				q_20_2: {
					prompt: "provides **other forms of visual interest through varied patterns, textures, light, or movement **(e.g. ground markings; mirrors/reflective surfaces; sculptures/artistic elements; diverse vegetation)"
				},
				q_20_3: {
					prompt: "has vegetation that provides** pleasant smells** (e.g. flowers; herbs; fruiting plants or trees; lavender bushes; eucalyptus trees)"
				},
				q_20_4: {
					prompt: "provides opportunities to **experience or create sounds** (e.g. musical instruments; motion/weight-activated sound devices; wind chimes; talking tubes; flowing water; wildlife sounds; rustling grasses)"
				},
				q_20_5: {
					prompt: "provides** tactile experiences through different textures, materials and/or vibration **(e.g. sand or mud play; soft-textured vegetation; musical elements that vibrate)"
				},
				q_20_6: {
					prompt: "has** places for retreat or withdrawa**l from sensory stimulation (e.g., small or enclosed spaces; nature-rich areas; isolated quiet spaces; quiet/passive zones separated from loud/active zones)"
				},
				q_20_7: {
					prompt: "has **consistent noise pollution** (e.g. from heavy traffic, trains, or loud music; pervasive winds; unpredictable noises) [this item need to be riversed coded]"
				}
			}
		},
		section_21_accommodating_diverse_abilities: {
			title: "Accommodating Diverse Abilities",
			description:
				"Accommodating Diverse Abilitites examines how effectively a play space supports children with diverse physical, sensory, and communication needs. It focuses on the accessibility and usability of play features, paths, and transitions; the availability of tools that help children express their needs; and the presence of design elements that enable participation from a wide range of body positions and abilities.",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve this playspace for diverse ages and abilitites.",
			questions: {
				q_21_1: {
					prompt: "has designated **accessible parking** (for motor vehicles and/or bicycles)"
				},
				q_21_2: {
					prompt: "has** digital or analog communication boards*** available that help children to communicate their needs and wishes (the communication board should reflect the play opportunities and amenities available in the play space)* Not to JL/TM: might need rewording, does everyone understand communication board"
				},
				q_21_3: {
					prompt: "has **accessible edges or points of access (flush or ramped) from the primary path to accessible play surfaces or directly onto play features**."
				},
				q_21_4: {
					prompt: "has **accessible manufactured play features that are isolated** from other play areas nor behind fencing or visual barriers (e.g., fenced-in wheelchair swings) [needs reversed coded]"
				},
				q_21_5: {
					prompt: "play features **support transitions in and out** (e.g., entry/exit ramps; ample space and/or platforms to transfer from a mobility device; slides with extended run-outs at the base for easy transfer)"
				},
				q_21_6: {
					prompt: "play features have **handrails and grips to assist with transitions** **and stability** that are easy to use for children with different abilities (e.g., located at various heights; in sizes and shapes suitable for different-sized hands)"
				},
				q_21_7: {
					prompt: "play features allow for** use from diverse body positions**, providing appropriate support for children with different needs (e.g., options for sitting, standing, or lying down; seats or swings with full-body support, wide bases, and/or secure straps; footrests so feet do not have to dangle)"
				},
				q_21_8: {
					prompt: 'has **accessible access to the highest points** and/or the "coolest" or most unique play features'
				},
				q_21_9: {
					prompt: "has clear,** tactile, and/or visual indicators** (e.g. color contrasts, material changes, or textured/dimpled surfaces, low raised boundaries) to define edges of paths or signal significant changes in height (e.g. edges of elevated platform) or transitions into new spaces (e.g. into the swing areas)"
				}
			}
		},
		section_22_playspace_suitability_for_diverse_users: {
			title: "Playspace Suitability for Diverse Users",
			description:
				"Playspace suitability for diverse users assesses how well the play space is designed to meet the needs of children across a wide range of ages and abilities.",
			instruction: "Read each statement and answer the questions. This playspace...",
			notesPrompt:
				"Any comments? Describe one or more recommendations to improve this playspace for diverse ages and abilitites.",
			questions: {
				q_22_1: {
					prompt: "serves the needs of **children aged 0-5 years**"
				},
				q_22_2: {
					prompt: "serves the needs of **children aged 6-12 years**"
				},
				q_22_3: {
					prompt: "serves the needs of **children aged  13 years or above **"
				},
				q_22_4: {
					prompt: "serves the needs of **children with physical disabilities** (e.g. children use mobility aids  such as walkers and wheelchairs, children with limited muscle strength,...)"
				},
				q_22_5: {
					prompt: "serves the needs of **children with visual impairments, including blindness and low vision**."
				},
				q_22_6: {
					prompt: "serves the needs of **children who are deaf or hard of hearing** (e.g. children who use hearing devices or implants, children with hearing loss)."
				},
				q_22_7: {
					prompt: "serves the needs of **children with intellectual and developmental disabilities** (e.g. learning or cognitive support needs)."
				}
			}
		}
	}
};
