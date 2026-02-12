//
// Created by joshua on 11/02/2026.
//


#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0A00
#endif
#define CPPHTTPLIB_NO_EXCEPTIONS

#include <windows.h>
#include "EuroScopePlugIn.h"
#include "httplib.h"
#include <string>
#include <map>
#include <thread>

struct AircraftState {
    std::string callsign;
    std::string status;
    std::string airport;
    std::string sid;
    std::string squawk;
    std::string route;
    bool airborne = false;
};

std::map<std::string, AircraftState> trackedAircraft;

class CDepartureListPlugin: public EuroScopePlugIn::CPlugIn {
public:
    CDepartureListPlugin() : CPlugIn(
        EuroScopePlugIn::COMPATIBILITY_CODE,
        "Departure List",
        "1.0.0",
        "Joshua Seagrave",
        "Free"
        ) {}

    ~CDepartureListPlugin() {}

    void OnFlightPlanControllerAssignedDataUpdate(
        EuroScopePlugIn::CFlightPlan flightPlan,
        int dataType) override {
        if (dataType != EuroScopePlugIn::CTR_DATA_TYPE_GROUND_STATE)
            return;

        std::string groundState = flightPlan.GetGroundState();

        // Valid states: STUP, PUSH, TAXI, DEPA, or empty (CLEAR)
        if (groundState != "STUP" &&
            groundState != "PUSH" &&
            groundState != "TAXI" &&
            groundState != "DEPA" &&
            !groundState.empty()) {
            return;
        }

        std::string callsign = flightPlan.GetCallsign();
        std::string airport = flightPlan.GetFlightPlanData().GetOrigin();

        // Handle CLEAR (empty ground state)
        if (groundState.empty()) {
            AircraftState state;
            state.callsign = callsign;
            state.airport = airport;
            state.status = "CLEAR";
            state.sid = "";
            state.squawk = "";
            state.route = "";
            state.airborne = false;

            // Remove from tracked aircraft
            trackedAircraft.erase(callsign);

            std::thread([this, state]() {
                PostStatusUpdate(state);
            }).detach();
            return;
        }
        std::string sid = flightPlan.GetFlightPlanData().GetSidName();
        std::string squawk = flightPlan.GetControllerAssignedData().GetSquawk();
        std::string route = flightPlan.GetFlightPlanData().GetRoute();

        AircraftState state;
        state.callsign = callsign;
        state.status = groundState;
        state.airport = airport;
        state.sid = sid;
        state.squawk = squawk;
        state.route = route;
        state.airborne = false;

        trackedAircraft[callsign] = state;

        std::thread([this, state]() {
            PostStatusUpdate(state);
        }).detach();
    }

    void OnRadarTargetPositionUpdate(
        EuroScopePlugIn::CRadarTarget radarTarget) override {
        std::string callsign = radarTarget.GetCallsign();

        auto it = trackedAircraft.find(callsign);
        if (it == trackedAircraft.end())
            return;

        AircraftState& state = it->second;

        if (state.status != "DEPA" || state.airborne)
            return;

        int groundSpeed = radarTarget.GetGS();
        int verticalRate = radarTarget.GetVerticalSpeed();

        if (groundSpeed > 40 && verticalRate > 200) {
            state.airborne = true;
            state.status = "AIRBORNE";
            std::thread([this, state]() {
                PostStatusUpdate(state);
            }).detach();
        }
    }

private:
    void PostStatusUpdate(const AircraftState& state) {
        std::string body = "{";
        body += R"("callsign":")" + state.callsign + "\",";
        body += R"("airport":")" + state.airport + "\",";
        body += R"("status":")" + state.status + "\",";
        body += R"("sid":")" + state.sid + "\",";
        body += R"("squawk":")" + state.squawk + "\",";
        body += R"("route":")" + state.route + "\"";
        body += "}";

        DisplayUserMessage("DepartureList", "Debug", "Attempting HTTP post...", true, true, false, false, false);

        try {
            httplib::Client client("127.0.0.1", 5000);
            client.set_connection_timeout(2);
            auto result = client.Post("/api/status-update", body, "application/json");

            if (result) {
                std::string msg = "HTTP response: " + std::to_string(result->status);
                DisplayUserMessage("DepartureList", "Debug", msg.c_str(), true, true, false, false, false);
            } else {
                std::string msg = "HTTP failed: " + httplib::to_string(result.error());
                DisplayUserMessage("DepartureList", "Debug", msg.c_str(), true, true, false, false, false);
            }
        } catch (...) {
            DisplayUserMessage("DepartureList", "Debug", "HTTP exception caught", true, true, false, false, false);
        }
    }
};

CDepartureListPlugin* plugin = nullptr;

void __declspec(dllexport) EuroScopePlugInInit(
    EuroScopePlugIn::CPlugIn** ppPlugInInstance) {
    *ppPlugInInstance = new CDepartureListPlugin();
}

void __declspec(dllexport) EuroScopePlugInExit()
{
    delete plugin;
    plugin = nullptr;
}