const SECTOR_GROUPS = [
  { id: 'TC_MIDLANDS', name: 'TC MIDLANDS' },
  { id: 'TC_NORTH', name: 'TC NORTH' },
  { id: 'TC_SOUTH', name: 'TC SOUTH' },
  { id: 'TC_EAST', name: 'TC EAST' },
  { id: 'TC_CAPITAL', name: 'TC CAPITAL' },
  { id: 'HEATHROW', name: 'HEATHROW' },
  { id: 'GATWICK', name: 'GATWICK' },
  { id: 'LUTON', name: 'LUTON' },
  { id: 'STANSTED', name: 'STANSTED' },
  { id: 'THAMES', name: 'THAMES' },
  { id: 'NORTHOLT', name: 'NORTHOLT' },
  { id: 'AIRFIELD_INFO', name: 'AIRFIELD_INFO'}
];

const AIRPORT_COLORS = {
  'EGLL' : '#00ff00',
  'EGSS' : '#ffff00',
  'EGGW' : '#ff8c00',
  'EGKK' : '#ff69b4'
};
const DEFAULT_AIRPORT_COLOR = '#4169e1';

const POSITION_CONFIGS = {
  "TC_MIDLANDS" : {
    "default_position" : "MIDLANDS_BANDBOX",
    "positions" : [
      {
        "id" : "COWLY_W",
        "name" : "COWLY W",
        "weather_sections" : [
          {
            "airport" : "EGSS",
            "label" : "STANSTED"
          }
        ],
        "sections" : [
          {
            "airport" : "EGBB",
            "label" : "EGBB UNGAP ADMEX CPT COWLY",
            "height_percent" : 50,
            "sids" : ["UNGAP", "ADMEX", "CPT", "COWLY"]
          },
          {
            "airport" : "EGBB",
            "label" : "EGBB DTY",
            "height_percent" : 50,
            "sids" : ["DTY"]
          }
        ]
      },
      {
        //TODO: COWLY_E is identical to COWLY_W at the moment. It shouldn't be. 
        // This is waiting on me to come up with a clever way to display the integrated weather display for multiple airports.
        "id" : "COWLY_E",
        "name" : "COWLY E",
        "weather_sections" : [
          {
            "airport" : "EGSS",
            "label" : "STANSTED"
          }
        ],
        "sections" : [
          {
            "airport" : "EGBB",
            "label" : "EGBB UNGAP ADMEX CPT COWLY",
            "height_percent" : 50,
            "sids" : ["UNGAP", "ADMEX", "CPT", "COWLY"]
          },
          {
            "airport" : "EGBB",
            "label" : "EGBB DTY",
            "height_percent" : 50,
            "sids" : ["DTY"]
          }
        ]
      },
      {
        "id" : "WELIN_WE",
        "name" : "WELIN W+E",
        "weather_sections" : [
          {
            "airport" : "EGSS",
            "label" : "STANSTED"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL UMLAT ULTIB",
            "height_percent" : 30,
            "sids" : ["UMLAT", "ULTIB"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS UTAVA NUGBO",
            "height_percent" : 20,
            "sids" : ["UTAVA", "NUGBO"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW OLNEY",
            "height_percent" : 15,
            "sids" : ["OLNEY"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC BPK",
            "height_percent" : 15,
            "sids" : ["BPK"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK LAM",
            "height_percent" : 10,
            "sids" : ["LAM"]
          },
          {
            "airport" : "EGBB",
            "label" : "EGBB UNGAP DTY",
            "height_percent" : 10,
            "sids" : ["UNGAP", "DTY"]
          }
        ]
      },
      {
        "id" : "MIDLANDS_BANDBOX",
        "name" : "MIDLANDS BANDBOX",
        "weather_sections" : [
          {
            "airport" : "EGSS",
            "label" : "STANSTED"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL UMLAT ULTIB",
            "height_percent" : 30,
            "sids" : ["UMLAT", "ULTIB"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS UTAVA NUGBO",
            "height_percent" : 20,
            "sids" : ["UTAVA", "NUGBO"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW OLNEY",
            "height_percent" : 15,
            "sids" : ["OLNEY"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC BPK",
            "height_percent" : 15,
            "sids" : ["BPK"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK LAM",
            "height_percent" : 10,
            "sids" : ["LAM"]
          },
          {
            "airport" : "EGBB",
            "label" : "EGBB COWLY CPT DTY ADMEX UNGAP",
            "height_percent" : 10,
            "sids" : ["COWLY", "CPT", "DTY", "ADMEX", "UNGAP"]
          }
        ]
      }
    ]
  },
  "TC_NORTH" : {
    "default_position" : "NORTH_BANDBOX",
    "positions" : [
      {
        "id": "BNN",
        "name": "BNN",
        "alias_for": "NW_DEPS" 
      },
      {
        "id" : "NW_DEPS",
        "name" : "NW DEPS",
        "linked_positions": ["BNN"],
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
        "sections" : [
        {
            "airport" : "EGLL",
            "label" : "EGLL ULTIB UMLAT BPK",
            "height_percent" : 40,
            "sids" : ["ULTIB", "UMLAT", "BPK"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS UTAVA NUGBO",
            "height_percent" : 20,
            "sids" : ["UTAVA", "NUGBO"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW RODNEY OLNEY",
            "height_percent" : 20,
            "sids" : ["RODNI", "OLNEY"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC SAXBI BPK",
            "height_percent" : 20,
            "sids" : ["BPK", "SAXBI"]
          }
        ]
      },
      {
        "id" : "NE_DEPS",
        "name" : "NE DEPS",
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL UMLAT ULTIB BPK BPK/L",
            "height_percent" : 35,
            "sids" : ["UMLAT", "ULTIB", "BPK"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK FRANE LAM NS WOD",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "DAGGA", "LAM"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS ALL",
            "height_percent" : 15,
            "sids" : ["CLN", "DET", "UTAVA", "NUGBO", "BKY"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW MATCH DET",
            "height_percent" : 15,
            "sids" : ["MATCH", "DET"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC BPK SAXBI ODUKU",
            "height_percent" : 11.5,
            "sids" : ["BPK", "SAXBI", "ODUKU"]
          }
        ]
      },
      {
        "id" : "LOREL",
        "name" : "LOREL",
        "weather_sections" : [
          {
            "airport" : "EGSS",
            "label" : "STANSTED"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL UMLAT ULTIB BPK BPK/L",
            "height_percent" : 35,
            "sids" : ["UMLAT", "ULTIB", "BPK"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK FRANE LAM NS WOD",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "DAGGA", "LAM"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS ALL",
            "height_percent" : 15,
            "sids" : ["CLN", "DET", "UTAVA", "NUGBO", "BKY"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW MATCH DET",
            "height_percent" : 15,
            "sids" : ["MATCH", "DET"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC BPK SAXBI ODUKU",
            "height_percent" : 11.5,
            "sids" : ["BPK", "SAXBI", "ODUKU"]
          }
        ]
      },
      {
        "id" : "LAM",
        "name" : "LAM",
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL BPK",
            "height_percent" : 35,
            "sids" : ["BPK"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK FRANE LAM",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "DAGGA", "LAM"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS ALL",
            "height_percent" : 15,
            "sids" : ["CLN", "DET"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW MATCH DET",
            "height_percent" : 15,
            "sids" : ["MATCH", "DET"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC BPK SAXBI ODUKU",
            "height_percent" : 11.5,
            "sids" : ["BPK", "SAXBI", "ODUKU"]
          }
        ]
      },

      {
        "id" : "NORTH_BANDBOX",
        "name" : "NORTH BANDBOX",
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL UMLAT ULTIB BPK BPK/L",
            "height_percent" : 35,
            "sids" : ["UMLAT", "ULTIB", "BPK"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK FRANE LAM NS WOD",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "DAGGA", "LAM"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS ALL",
            "height_percent" : 15,
            "sids" : ["CLN", "DET", "UTAVA", "NUGBO", "BKY"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW ALL",
            "height_percent" : 15,
            "sids" : ["MATCH", "DET", "RODNI", "OLNEY"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC BPK SAXBI ODUKU",
            "height_percent" : 11.5,
            "sids" : ["BPK", "SAXBI", "ODUKU"]
          },
        ]
      }
    ]
  },
  "TC_SOUTH" : {
    "default_position" : "SOUTH_BANDBOX",
    "positions" : [
      {
        "id" : "WILLO",
        "name" : "WILLO",
        "weather_sections" : [
          {
            "airport" : "EGKK",
            "label" : "GATWICK"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL CPT GOG GAS MOD MAX",
            "height_percent" : 40,
            "sids" : ["CPT", "GOGSI", "GASGU", "MODMI", "MAXIT"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK BOG HAR SFD KEN SAM",
            "height_percent" : 40,
            "sids" : ["BOGNA", "HARDY", "SFD", "KENET", "SAM"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW RODNI",
            "height_percent" : 20,
            "sids" : ["RODNI"]
          },
        ]
      },
      {
        "id" : "SW_DEPS",
        "name" : "SW DEPS",
        "linked_positions": ["OCK"],
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL CPT GOG GAS MOD MAX",
            "height_percent" : 40,
            "sids" : ["CPT", "GOGSI", "GASGU", "MODMI", "MAXIT"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK BOG HAR SFD KEN SAM NOVMA IMVUR",
            "height_percent" : 40,
            "sids" : ["BOGNA", "HARDY", "SFD", "KENET", "SAM", "NOVMA", "IMVUR"],
            "route_indicators" : [
              { "keyword" : "NUBRI", "display" : "KENET" },
              { "keyword" : "SAM", "display" : "SAM" }
            ]

          },
          {
            "airport" : "EGGW",
            "label" : "EGGW RODNI",
            "height_percent" : 20,
            "sids" : ["RODNI"]
          },
        ]
      },
      {
        "id" : "OCK",
        "name" : "OCK",
        "alias_for" : "SW_DEPS"
      },
      {
        "id" : "BIG",
        "name" : "BIG",
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL DET",
            "height_percent" : 35,
            "sids" : ["DET"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK FRANE ODVIK DVR MIMFO LAM",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "ODVIK", "DVR", "MIMFO", "LAM"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS DET",
            "height_percent" : 15,
            "sids" : ["DET"],
            "route_indicators" : [
              { "keyword" : "DVR", "display" : "DVR" },
              { "keyword" : "LYD", "display" : "LYD" },
            ]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW DET",
            "height_percent" : 15,
            "sids" : ["DET"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC SOQQA",
            "height_percent" : 11.5,
            "sids" : ["SOQQA",]
          },
        ]
      },
      {
        "id" : "TIMBA",
        "name" : "TIMBA",
        "weather_sections" : [
          {
            "airport" : "EGKK",
            "label" : "GATWICK"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL DET",
            "height_percent" : 35,
            "sids" : ["DET"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK FRANE ODVIK DVR MIMFO LAM",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "ODVIK", "DVR", "MIMFO", "LAM"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS DET",
            "height_percent" : 15,
            "sids" : ["DET"],
                "route_indicators" : [
                  { "keyword" : "DVR", "display" : "DVR" },
                  { "keyword" : "LYD", "display" : "LYD" },
                ]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW DET",
            "height_percent" : 15,
            "sids" : ["DET"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC SOQQA",
            "height_percent" : 11.5,
            "sids" : ["SOQQA"]
          },
        ]
      },
      {
        "id" : "GODLU",
        "name" : "GODLU",
        "weather_sections" : [
          {
            "airport" : "EGLC",
            "label" : "LONDON CITY"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLC",
            "label" : "EGLC SOQQA",
            "height_percent" : 50,
            "sids" : ["SOQQA"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS DET",
            "height_percent" : 25,
            "sids" : ["DET"],
                "route_indicators" : [
                  { "keyword" : "DVR", "display" : "DVR" },
                  { "keyword" : "LYD", "display" : "LYD" },
                ]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW DET",
            "height_percent" : 25,
            "sids" : ["DET"]
          },

        ]
      },
      {
        "id" : "SOUTH_BANDBOX",
        "name" : "SOUTH BANDBOX",
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
                "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL CPT DET GAS GOG MOD MAX",
            "height_percent" : 35,
            "sids" : ["CPT", "DET", "GASGU", "GOGSI", "MODMI", "MAXIT"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK ALL",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "ODVIK", "DVR", "MIMFO", "LAM", "BOGNA", "HARDY", "SFD", "KENET", "SAM", "NOVMA", "IMVUR"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS DET",
            "height_percent" : 15,
            "sids" : ["DET"],
                "route_indicators" : [
                  { "keyword" : "DVR", "display" : "DVR" },
                  { "keyword" : "LYD", "display" : "LYD" },
                ]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW RODNI DET",
            "height_percent" : 15,
            "sids" : ["RODNI", "DET"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC SOQQA",
            "height_percent" : 11.5,
            "sids" : ["SOQQA",]
          },
        ]
      },
    ]
  },
  "TC_EAST" : {
    "default_position" : "EAST_BANDBOX",
    "positions" : [
      {
        "id" : "DAGGA",
        "name" : "DAGGA",
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL BPK BPK/L",
            "height_percent" : 35,
            "sids" : ["BPK"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK FRANE DAGGA",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "DAGGA"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS CLN",
            "height_percent" : 15,
            "sids" : ["CLN"],
                "route_indicators" : [
                  { "keyword" : "ABTUM", "display" : "DVR" }
                ]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC CLN ODUKU",
            "height_percent" : 15,
            "sids" : ["CLN", "ODUKU"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW MATCH",
            "height_percent" : 11.5,
            "sids" : ["MATCH"],
                "route_indicators" : [
                  { "keyword" : "ITVIP", "display" : "ITVIP" },
                  { "keyword" : "ABTUM", "display" : "DVR" }
                ]
          }
        ]
      },
      {
        "id" : "REDFA",
        "name" : "REDFA",
        "weather_sections" : [
          {
            "airport" : "EGSS",
            "label" : "STANSTED"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL BPK BPK/L",
            "height_percent" : 35,
            "sids" : ["BPK"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK FRANE DAGGA",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "DAGGA"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS CLN",
            "height_percent" : 15,
            "sids" : ["CLN"],
                "route_indicators" : [
                  { "keyword" : "ABTUM", "display" : "DVR" }
                ]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC CLN ODUKU",
            "height_percent" : 15,
            "sids" : ["CLN", "ODUKU"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW MATCH",
            "height_percent" : 11.5,
            "sids" : ["MATCH"],
                "route_indicators" : [
                  { "keyword" : "ITVIP", "display" : "ITVIP" },
                  { "keyword" : "ABTUM", "display" : "DVR" }
                ]
          }
        ]
      },
      {
        "id" : "SABER",
        "name" : "SABER",
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
        "sections" : [
          {
            "airport" : "EGGW",
            "label" : "EGGW MATCH",
            "height_percent" : 50,
            "sids" : ["MATCH"],
                "route_indicators" : [
                  { "keyword" : "ITVIP", "display" : "ITVIP" },
                  { "keyword" : "ABTUM", "display" : "DVR" }
                ]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS CLN",
            "height_percent" : 50,
            "sids" : ["CLN"],
                "route_indicators" : [
                  { "keyword" : "ABTUM", "display" : "DVR" }
                ]
          }
        ]
      },
      {
        "id" : "JACKO",
        "name" : "JACKO",
        "weather_sections" : [
          {
            "airport" : "EGLC",
            "label" : "LONDON CITY"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL BPK BPK/L",
            "height_percent" : 35,
            "sids" : ["BPK"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK FRANE DAGGA",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "DAGGA"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS CLN",
            "height_percent" : 15,
            "sids" : ["CLN"],
                "route_indicators" : [
                  { "keyword" : "ABTUM", "display" : "DVR" }
                ]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC CLN ODUKU",
            "height_percent" : 15,
            "sids" : ["CLN", "ODUKU"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW MATCH",
            "height_percent" : 11.5,
            "sids" : ["MATCH"],
                "route_indicators" : [
                  { "keyword" : "ITVIP", "display" : "ITVIP" },
                  { "keyword" : "ABTUM", "display" : "DVR" }
                ]
          }
        ]
      },
      {
        "id" : "EAST_BANDBOX",
        "name" : "EAST BANDBOX",
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL BPK BPK/L",
            "height_percent" : 35,
            "sids" : ["BPK"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK FRANE DAGGA",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "DAGGA"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS CLN",
            "height_percent" : 15,
            "sids" : ["CLN"],
                "route_indicators" : [
                  { "keyword" : "ABTUM", "display" : "DVR" }
                ]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC CLN ODUKU",
            "height_percent" : 15,
            "sids" : ["CLN", "ODUKU"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW MATCH",
            "height_percent" : 11.5,
            "sids" : ["MATCH"],
                "route_indicators" : [
                  { "keyword" : "ITVIP", "display" : "ITVIP" },
                  { "keyword" : "ABTUM", "display" : "DVR" }
                ]
          }
        ]
      },
      
    ]
  },
  "TC_CAPITAL" : {
    "default_position" : "VATON_CPT",
    "positions" : [
      {
        "id" : "VATON_CPT",
        "name" : "VATON + CPT",
        "weather_sections" : [
          {
            "airport" : "EGSS",
            "label" : "STANSTED"
          }
        ],
        "sections" : [
          {
            "airport" : "EGKK",
            "label" : "EGKK LAM",
            "height_percent" : 35,
            "sids" : ["LAM"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK KENET NOVMA/K IMVUR/K",
            "height_percent" : 23.5,
            "required_route_keywords": ["KENET"],
            "sids" : ["KENET", "NOVMA", "IMVUR"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS NUGBO",
            "height_percent" : 15,
            "sids" : ["NUGBO"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW RODNI",
            "height_percent" : 15,
            "sids" : ["RODNI"]
          },
          {
            "airport" : "EGBB",
            "label" : "EGBB CPT COWLY ADMEX",
            "height_percent" : 11.5,
            "sids" : ["CPT", "COWLY", "ADMEX"]
          }
        ]
      }
    ]
  },
  "HEATHROW" : {
    "default_position" : "LL_INT_N",
    "positions" : [
      {
        "id" : "LL_INT_N",
        "name" : "LL INT N",
        "linked_positions" : ["LL_INT_S", "LL_SPT_N", "LL_SPT_S", "LL_FIN"],
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL NORTH ALL",
            "height_percent" : 40,
            "sids" : ["BPK", "UMLAT", "ULTIB"]
          },
          {
            "airport" : "EGLL",
            "label" : "EGLL SOUTH ALL",
            "height_percent" : 40,
            "sids" : [ "CPT", "DET", "MODMI", "MAXIT", "GOGSI", "GASGU"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC ALL",
            "height_percent" : 20,
            "sids" : ["BPK", "SOQQA", "SAXBI", "ODUKU"]
          }
        ]
      },
      {
        "id" : "LL_INT_S",
        "name" : "LL INT S",
        "alias_for" : "LL_INT_N"
      },
      {
        "id" : "LL_SPT_N",
        "name" : "LL SPT N",
        "alias_for" : "LL_INT_N"
      },
            {
        "id" : "LL_SPT_S",
        "name" : "LL SPT S",
        "alias_for" : "LL_INT_N"
      },
            {
        "id" : "LL_FIN",
        "name" : "LL FIN",
        "alias_for" : "LL_INT_N"
      },
    ]
  },
  "GATWICK" : {
    "default_position" : "KK_INT",
    "positions" : [
      {
        "id" : "KK_INT",
        "name" : "KK INT",
        "linked_positions" : ["KK_SPT", "KK_FIN"],
        "weather_sections" : [
          {
            "airport" : "EGKK",
            "label" : "GATWICK"
          }
        ],
        "sections" : [
          {
            "airport" : "EGKK",
            "label" : "EGKK EAST DEP",
            "height_percent" : 40,
            "sids" : ["LAM", "MIMFO", "ODVIK", "FRANE"]
          },
                    {
            "airport" : "EGKK",
            "label" : "EGKK WEST DEP",
            "height_percent" : 40,
            "sids" : ["NOVMA", "KENET", "IMVUR", "SAM"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK SOUTH DEP",
            "height_percent" : 20,
            "sids" : ["SFD", "BOGNA"]
          }
        ]
      },
      {
        "id" : "KK_SPT",
        "name" : "KK SPT",
        "alias_for" : "KK_INT"
      },
      {
        "id" : "KK_FIN",
        "name" : "KK FIN",
        "alias_for" : "KK_INT"
      },
    ]
  },
  "LUTON" : {
    "default_position" : "GW_INT",
    "positions" : [
      {
        "id" : "GW_INT",
        "name" : "GW INT",
        "linked_positions" : ["GW_FIN"],
        "weather_sections" : [
          {
            "airport" : "EGGW",
            "label" : "LUTON"
          }
        ],
        "sections" : [
          {
            "airport" : "EGGW",
            "label" : "EGGW EAST DEP",
            "height_percent" : 30,
            "sids" : ["MATCH", "DET"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW WEST DEP",
            "height_percent" : 30,
            "sids" : ["RODNI", "OLNEY"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW SDR",
            "height_percent" : 20,
            "sids" : ["KILO", "MIKE", "NOVEMBER", "PAPA", "ROMEO", "SIERRA", "TANGO", "UNIFORM", "VICTOR", "JULIET", "WHISKEY"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC ALL",
            "height_percent" : 20,
            "sids" : ["BPK", "SOQQA", "SAXBI", "ODUKU"]
          }
        ]
      },
      {
        "id" : "GW_FIN",
        "name" : "GW FIN",
        "alias_for" : "GW_INT"
      },
    ]
  },
  "STANSTED" : {
    "default_position" : "SS_INT",
    "positions" : [
      {
        "id" : "SS_INT",
        "name" : "SS INT",
        "linked_positions" : ["SS_SPT", "SS_FIN"],
        "weather_sections" : [
          {
            "airport" : "EGSS",
            "label" : "STANSTED"
          }
        ],
        "sections" : [
          {
            "airport" : "EGSS",
            "label" : "EGSS EAST DEP",
            "height_percent" : 50,
            "sids" : ["CLN", "DET"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS WEST DEP",
            "height_percent" : 50,
            "sids" : ["NUGBO", "UTAVA", "BKY"]
          }
        ]
      },
      {
        "id" : "SS_SPT",
        "name" : "SS SPT",
        "alias_for" : "SS_INT"
      },
      {
        "id" : "SS_FIN",
        "name" : "SS FIN",
        "alias_for" : "SS_INT"
      },
    ]
  },
  
  "THAMES" : {
    "default_position" : "LC_DIR",
    "positions" : [
      {
        "id" : "LC_DIR",
        "name" : "LC_DIR",
        "linked_positions" : ["THS_DIR", "THS_RDR"],
        "weather_sections" : [
          {
            "airport" : "EGLC",
            "label" : "LONDON CITY"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLC",
            "label" : "EGLC ALL",
            "height_percent" : 50,
            "sids" : ["BPK", "SAXBI", "ODUKU", "SOQQA"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS DET DVR DET LYD",
            "height_percent" : 25,
            "sids" : ["DET"],
            "route_indicators" : [
              { "keyword" : "DVR", "display" : "DVR" },
              { "keyword" : "LYD", "display" : "LYD" },
            ]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW DET",
            "height_percent" : 25,
            "sids" : ["DET"]
          }
        ]
      },
      {
        "id" : "THS_DIR",
        "name" : "THS DIR",
        "alias_for" : "LC_DIR"
      },
      {
        "id" : "THS_RDR",
        "name" : "THS RDR",
        "alias_for" : "LC_DIR"
      },
    ]
  }
};