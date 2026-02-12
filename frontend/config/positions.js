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
  { id: 'BIRMINGHAM', name: 'BIRMINGHAM' },
  { id: 'BIGGIN_HILL', name: 'BIGGIN HILL' },
  { id: 'SOUTHAMPTON', name: 'SOUTHAMPTON' },
  { id: 'NORTHOLT', name: 'NORTHOLT' }
];

const AIRPORT_COLORS = {
  'EGLL' : '#00ff00',
  'EGSS' : '#ffff00',
  'EGGW' : '#ff8c00',
  'EGKK' : '#ff69b4'
};
const DEFAULT_AIRPORT_COLOR = '#4169e1';

const POSITION_CONFIGS = {
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
            "label" : "EGLL BPK",
            "height_percent" : 50,
            "sids" : ["BPK"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK DAGGA FRANE",
            "height_percent" : 25,
            "sids" : ["FRANE", "DAGGA"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW MATCH",
            "height_percent" : 25,
            "sids" : ["MATCH"],
                "route_indicators" : [
                  { "keyword" : "M85", "display" : "ITVIP" },
                  { "keyword" : "M84", "display" : "DVR" }
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
            "airport" : "EGSS",
            "label" : "EGSS CLN",
            "height_percent" : 50,
            "sids" : ["CLN"],
                "route_indicators" : [
                  { "keyword" : "M84", "display" : "DVR" }
                ]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC CLN ODUKU",
            "height_percent" : 50,
            "sids" : ["CLN", "ODUKU"]
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
            "airport" : "EGKK",
            "label" : "EGKK DAGGA FRANE",
            "height_percent" : 40,
            "sids" : ["FRANE", "DAGGA"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS CLN",
            "height_percent" : 30,
            "sids" : ["CLN"],
                "route_indicators" : [
                  { "keyword" : "M84", "display" : "DVR" }
                ]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW MATCH",
            "height_percent" : 30,
            "sids" : ["MATCH"],
                "route_indicators" : [
                  { "keyword" : "M85", "display" : "ITVIP" },
                  { "keyword" : "M84", "display" : "DVR" }
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
            "airport" : "EGSS",
            "label" : "EGSS CLN",
            "height_percent" : 100,
            "sids" : ["CLN"]
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
            "label" : "EGKK DAGGA FRANE",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "DAGGA"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS CLN",
            "height_percent" : 15,
            "sids" : ["CLN"],
                "route_indicators" : [
                  { "keyword" : "M84", "display" : "DVR" }
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
                  { "keyword" : "M85", "display" : "ITVIP" },
                  { "keyword" : "M84", "display" : "DVR" }
                ]
          }
        ]
      },
      
    ]
  },
  "TC_NORTH" : {
    "default_position" : "NORTH_BANDBOX",
    "positions" : [
      {
        "id" : "NE_DEPS",
        "name" : "NE DEPS",
        "linked_positions": ["LOREL"],
        "weather_sections" : [
          {
            "airport" : "EGSS",
            "label" : "STANSTED"
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
            "label" : "EGKK DAGGA FRANE",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "DAGGA"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS CLN DET",
            "height_percent" : 15,
            "sids" : ["CLN", "DET"],
                "route_indicators" : [
                  { "keyword" : "M84", "display" : "DVR" }
                ]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC CLN ODUKU BPK SAXBI",
            "height_percent" : 15,
            "sids" : ["CLN", "ODUKU", "BPK", "SAXBI"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW MATCH DET",
            "height_percent" : 11.5,
            "sids" : ["MATCH", "DET"],
                "route_indicators" : [
                  { "keyword" : "M85", "display" : "ITVIP" },
                  { "keyword" : "M84", "display" : "DVR" }
                ]
          }
        ]
      },
      {
        "id": "LOREL",
        "name": "LOREL",
        "alias_for": "NE_DEPS" 
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
            "airport" : "EGKK",
            "label" : "EGKK DAGGA FRANE",
            "height_percent" : 100,
            "sids" : ["FRANE", "DAGGA"]
          },
        ]
      },
      {
        "id" : "NW_DEPS",
        "name" : "NW DEPS",
        "linked_positions": ["BNN"],
        "weather_sections" : [
          {
            "airport" : "EGGW",
            "label" : "LUTON"
          }
        ],
        "sections" : [
        {
            "airport" : "EGLL",
            "label" : "EGLL ULTIB UMLAT",
            "height_percent" : 40,
            "sids" : ["ULTIB", "UMLAT"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS UTAVA NUGBO",
            "height_percent" : 20,
            "sids" : ["UTAVA", "NUGBO"]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC BPK SAXBI",
            "height_percent" : 20,
            "sids" : ["BPK", "SAXBI"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW OLNEY RODNI",
            "height_percent" : 20,
            "sids" : ["OLNEY", "RODNI"]
          },
        ]
      },
      {
        "id": "BNN",
        "name": "BNN",
        "alias_for": "NW_DEPS" 
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
            "label" : "EGLL BPK UMLAT ULTIB",
            "height_percent" : 35,
            "sids" : ["BPK", "UMLAT", "ULTIB"]
          },
          {
            "airport" : "EGKK",
            "label" : "EGKK DAGGA FRANE",
            "height_percent" : 23.5,
            "sids" : ["FRANE", "DAGGA"]
          },
          {
            "airport" : "EGSS",
            "label" : "EGSS ALL",
            "height_percent" : 15,
            "sids" : ["CLN", "DET", "UTAVA", "NUGBO"],
                "route_indicators" : [
                  { "keyword" : "M84", "display" : "DVR" }
                ]
          },
          {
            "airport" : "EGLC",
            "label" : "EGLC CLN ODUKU BPK SAXBI",
            "height_percent" : 15,
            "sids" : ["CLN", "ODUKU", "BPK", "SAXBI"]
          },
          {
            "airport" : "EGGW",
            "label" : "EGGW ALL",
            "height_percent" : 11.5,
            "sids" : ["MATCH", "DET", "RODNI", "OLNEY"],
                "route_indicators" : [
                  { "keyword" : "M85", "display" : "ITVIP" },
                  { "keyword" : "M84", "display" : "DVR" }
                ]
          }
        ]
      }
    ]
  },
  "HEATHROW" : {
    "default_position" : "LL_INT",
    "positions" : [
      {
        "id" : "LL_INT",
        "name" : "HEATHROW INT",
        "weather_sections" : [
          {
            "airport" : "EGLL",
            "label" : "HEATHROW"
          }
        ],
        "sections" : [
          {
            "airport" : "EGLL",
            "label" : "EGLL ALL",
            "height_percent" : 100,
            "sids" : ["BPK", "CPT", "GASGU", "GOSGI", "DET", "MODMI", "MAXIT"]
          }
        ]
      }
    ]
  },
  "GATWICK" : {
    "default_position" : "KK_INT",
    "positions" : [
      {
        "id" : "KK_INT",
        "name" : "GATWICK INT",
        "weather_sections" : [
          {
            "airport" : "EGKK",
            "label" : "GATWICK"
          }
        ],
        "sections" : [
          {
            "airport" : "EGKK",
            "label" : "EGLL ALL",
            "height_percent" : 100,
            "sids" : ["BOGNA", "DAGGA", "FRANE", "HARDY", "IMVUR", 
                      "LAM", "NOVMA", "ODVIK", "SFD", "TIGER", "WIZAD",
                      "DVR", "KENET", "MIMFO", "SAM"]
          }
        ]
      }
    ]
  },
  "STANSTED" : {
    "default_position" : "SS_INT",
    "positions" : [
      {
        "id" : "SS_INT",
        "name" : "STANSTED INT",
        "weather_sections" : [
          {
            "airport" : "EGSS",
            "label" : "STANSTED"
          }
        ],
        "sections" : [
          {
            "airport" : "EGSS",
            "label" : "EGSS ALL",
            "height_percent" : 100,
            "sids" : ["CLN", "DET", "NUGBO", "UTAVA", "BKY"]
          }
        ]
      }
    ]
  },
  "LUTON" : {
    "default_position" : "GW_INT",
    "positions" : [
      {
        "id" : "GW_INT",
        "name" : "LUTON INT",
        "weather_sections" : [
          {
            "airport" : "EGGW",
            "label" : "LUTON"
          }
        ],
        "sections" : [
          {
            "airport" : "EGGW",
            "label" : "EGGW ALL",
            "height_percent" : 100,
            "sids" : ["MATCH", "RODNI", "DET", "OLNEY"]
          }
        ]
      }
    ]
  },
  "THAMES" : {
    "default_position" : "THAMES_INT",
    "positions" : [
      {
        "id" : "THAMES_INT",
        "name" : "THAMES INT",
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
            "height_percent" : 100,
            "sids" : ["BPK", "SAXBI", "ODUKU", "SOQQA"]
          }
        ]
      }
    ]
  }
};