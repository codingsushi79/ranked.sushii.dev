import fs from "fs";
import path from "path";

export const GSI_CONFIG_FILENAME = "gamestate_integration_ranked_cs2.cfg";

export function writeGsiConfig(cfgDir: string, port: number): string {
  const filePath = path.join(cfgDir, GSI_CONFIG_FILENAME);
  const contents = `"Ranked CS2"
{
    "uri"               "http://127.0.0.1:${port}/"
    "timeout"           "5.0"
    "buffer"            "0.1"
    "throttle"          "0.1"
    "heartbeat"         "30.0"
    "data"
    {
        "provider"                  "1"
        "map"                       "1"
        "map_round_wins"            "1"
        "round"                     "1"
        "player_id"                 "1"
        "player_state"              "1"
        "player_match_stats"        "1"
        "player_weapons"            "0"
        "player_position"           "0"
        "phase_countdowns"          "1"
        "allplayers_id"             "1"
        "allplayers_state"          "0"
        "allplayers_match_stats"    "1"
        "allplayers_weapons"        "0"
        "allplayers_position"       "0"
        "allgrenades"               "0"
        "bomb"                      "0"
    }
}
`;

  fs.writeFileSync(filePath, contents, "utf8");
  return filePath;
}
