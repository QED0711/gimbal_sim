use clap::Parser;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::{fs::{File, OpenOptions}, io::{self, Write}, path::Path, sync::Arc};
use tauri::State;
use crate::utils::AppSharedState;

#[derive(Debug, Parser)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// absolute path to config file
    #[arg(short, long, default_value = "/opt/gimbal.conf")]
    pub file_path: String,
    
    #[arg(short, long, default_value="true")]
    pub gst_debug: bool
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(default)]
pub struct Location {
    lat: f64,
    lng: f64,
    alt: Option<f64>,
}

impl Default for Location {
    fn default() -> Self {
        Location { lat: 0.0, lng: 0.0, alt: Some(0.0) }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(default)]
pub struct Orientation {
    heading: u16,
    speed: f64,
}

impl Default for Orientation {
    fn default() -> Self {
        Orientation { heading: 0, speed: 0.0 }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(default)]
pub struct Orbit {
    #[serde(rename = "type")]
    orbit_type: String,
    rate: f32,
}

impl Default for Orbit {
    fn default() -> Self {
        Orbit { orbit_type: "no-orbit".to_string(), rate: 1.0 }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(default)]
pub struct Vehicle {
    model: String,
    name: String,
    cot_type: String,
    route: Vec<Location>,
    speed: i32,
    broadcast_cot: bool
}

impl Default for Vehicle {
    fn default() -> Self {
        Vehicle {
            model: "whiteCar".to_string(), 
            name: "".to_string(),
            cot_type: "a-u-G".to_string(), // defaults to atom-unknown-ground
            route: vec![], 
            speed: 0, 
            broadcast_cot: false
        }
    }
}


#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(default)]
pub struct MissionTemplate {
    name: String,
    aircraft_location: Location,
    orientation: Orientation,
    target_location: Option<Location>,
    target_lock: bool,
    orbit: Orbit, 
    vehicles: Vec<Vehicle>,
}

impl Default for MissionTemplate {
    fn default() -> Self {
        MissionTemplate { 
            name: "DEFAULT".to_string(),
            aircraft_location: Location::default(),
            orientation: Orientation::default(),
            target_location: None,
            target_lock: false,
            orbit: Orbit::default(),
            vehicles: vec![],
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(default)]
pub struct GamepadLayout {
    yaw_axis: i8,
    pitch_axis: i8,
    zoom_axis: i8,
    lock_button: i8,
    camera_type_button: i8,
}

impl Default for GamepadLayout {
    fn default() -> Self {
        GamepadLayout{
            yaw_axis: -1,
            pitch_axis: -1, 
            zoom_axis: -1,
            lock_button: -1,
            camera_type_button: -1
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(default)]
pub struct Config {
    pub stream_address: String,
    pub stream_port: String, 
    pub terrain_rendering_threshold: f32,
    pub fps: i32,
    pub gamepad_layout: GamepadLayout,
    pub hud_fps: i32,
    pub overlay_alpha: f32,
    pub ion_access_token: Option<String>, 
    pub background_tile_url: Option<String>,
    pub vector_tile_url: Option<String>,

    pub mission_templates: Vec<MissionTemplate>,
}



impl Default for Config {
    fn default() -> Self {
        Config {
            stream_address: "127.0.0.1".to_string(),
            stream_port: "15000".to_string(),
            terrain_rendering_threshold: 2.0,
            fps: 30,
            hud_fps: 5,
            overlay_alpha: 0.5,
            ion_access_token: None,
            background_tile_url: None, 
            vector_tile_url: None, 
            gamepad_layout: GamepadLayout::default(),

            mission_templates: vec![
                MissionTemplate::default()
            ],
        }
    }
}

pub fn parse_config() -> Config {
    let args = Args::parse();

    let path = Path::new(&args.file_path);
    if !path.exists() {
        let default = Config::default();
        let mut file = File::create(path).expect("could not create file at path");

        let contents = serde_yaml::to_string(&default).expect("could not instantiate default config contents");
        file.write_all(contents.as_bytes()).expect("could not write default values to file");
        
        return default; 
    } else {
        let file = File::open(path).expect("could not open file at path");
        let config: Config = serde_yaml::from_reader(file).expect("could not read config file at path");

        return config;
    }
}

#[tauri::command]
pub fn retrieve_config(state: State<Arc<AppSharedState>>) -> Config {
    state.inner().config.clone()
}