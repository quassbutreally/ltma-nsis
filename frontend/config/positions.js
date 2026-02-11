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

const POSITION_CONFIGS = {
  "TC_EAST": {
    "positions": [
      {
        "id": "SABER",
        "name": "SABER",
        "weather_sections": [
          {
            "airport": "EGLL",
            "label": "HEATHROW"
          }
        ],
        "sections": [
          {
            "airport": "EGLL",
            "label": "EGLL BPK BPK/L",
            "height_percent": 35,
            "sids": ["BPK"]
          },
          {
            "airport": "EGKK",
            "label": "EGKK DAGGA FRANE",
            "height_percent": 23.5,
            "sids": ["FRANE", "DAGGA"]
          },
          {
            "airport": "EGSS",
            "label": "EGSS CLN",
            "height_percent": 14.725,
            "sids": ["CLN"],
                "route_indicators": [
                  { "keyword": "M84", "display": "DVR" }
                ]
          },
          {
            "airport": "EGLC",
            "label": "EGLC CLN ODUKU",
            "height_percent": 14.725,
            "sids": ["CLN", "ODUKU"]
          },
          {
            "airport": "EGGW",
            "label": "EGGW MATCH",
            "height_percent": 11.5,
            "sids": ["MATCH"],
                "route_indicators": [
                  { "keyword": "M85", "display": "ITVIP" },
                  { "keyword": "M84", "display": "DVR" }
                ]
          }
        ]
      },
      {
        "id": "JACKO",
        "name": "JACKO",
        "weather_sections": [
          {
            "airport": "EGSS",
            "label": "STANSTED"
          }
        ],
        "sections": [
          {
            "airport": "EGSS",
            "label": "EGSS CLN",
            "height_percent": 100,
            "sids": ["CLN"]
          }
        ]
      },
      {
        "id": "DAGGA",
        "name": "DAGGA",
        "weather_sections": [],
        "sections": [
          {
            "airport": "EGKK",
            "label": "EGKK CLN",
            "height_percent": 100,
            "sids": ["CLN"]
          }
        ]
      },
      {
        "id": "REDFA",
        "name": "REDFA",
        "weather_sections": [],
        "sections": [
          {
            "airport": "EGGW",
            "label": "EGGW CLN",
            "height_percent": 100,
            "sids": ["CLN"]
          }
        ]
      }
    ]
  },
  "TC_NORTH": {
    "positions": [
      {
        "id": "LOGAN",
        "name": "LOGAN",
        "weather_sections": [],
        "sections": [
          {
            "airport": "EGLL",
            "label": "EGLL CPT",
            "height_percent": 100,
            "sids": ["CPT"]
          }
        ]
      }
    ]
  },
  "HEATHROW": {
    "positions": [
      {
        "id": "EGLL_GND",
        "name": "EGLL GND",
        "weather_sections": [
          {
            "airport": "EGLL",
            "label": "HEATHROW"
          }
        ],
        "sections": [
          {
            "airport": "EGLL",
            "label": "EGLL BPK BPK/L",
            "height_percent": 50,
            "sids": ["BPK", "BPK/L"]
          },
          {
            "airport": "EGLL",
            "label": "EGLL CPT",
            "height_percent": 50,
            "sids": ["CPT"]
          }
        ]
      },
      {
        "id": "EGLL_TWR",
        "name": "EGLL TWR",
        "weather_sections": [
          {
            "airport": "EGLL",
            "label": "HEATHROW"
          }
        ],
        "sections": [
          {
            "airport": "EGLL",
            "label": "EGLL ALL",
            "height_percent": 100,
            "sids": ["BPK", "CPT", "SAM"]
          }
        ]
      }
    ]
  }
};