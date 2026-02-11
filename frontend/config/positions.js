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
  "TC_EAST": {
    "default_position" : "EAST BANDBOX",
    "positions": [
      {
        "id": "DAGGA",
        "name": "DAGGA",
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
            "sids": ["BPK"]
          },
          {
            "airport": "EGKK",
            "label": "EGKK DAGGA FRANE",
            "height_percent": 25,
            "sids": ["FRANE", "DAGGA"]
          },
          {
            "airport": "EGGW",
            "label": "EGGW MATCH",
            "height_percent": 25,
            "sids": ["MATCH"],
                "route_indicators": [
                  { "keyword": "M85", "display": "ITVIP" },
                  { "keyword": "M84", "display": "DVR" }
                ]
          }
        ]
      },
      {
        "id": "REDFA",
        "name": "REDFA",
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
            "height_percent": 50,
            "sids": ["CLN"],
                "route_indicators": [
                  { "keyword": "M84", "display": "DVR" }
                ]
          },
          {
            "airport": "EGLC",
            "label": "EGLC CLN ODUKU",
            "height_percent": 50,
            "sids": ["CLN", "ODUKU"]
          }
        ]
      },
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
            "airport": "EGKK",
            "label": "EGKK DAGGA FRANE",
            "height_percent": 40,
            "sids": ["FRANE", "DAGGA"]
          },
          {
            "airport": "EGSS",
            "label": "EGSS CLN",
            "height_percent": 30,
            "sids": ["CLN"],
                "route_indicators": [
                  { "keyword": "M84", "display": "DVR" }
                ]
          },
          {
            "airport": "EGGW",
            "label": "EGGW MATCH",
            "height_percent": 30,
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
            "airport": "EGLC",
            "label": "LONDON CITY"
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
        "id": "EAST BANDBOX",
        "name": "EAST BANDBOX",
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
            "height_percent": 15,
            "sids": ["CLN"],
                "route_indicators": [
                  { "keyword": "M84", "display": "DVR" }
                ]
          },
          {
            "airport": "EGLC",
            "label": "EGLC CLN ODUKU",
            "height_percent": 15,
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
      
    ]
  }
};