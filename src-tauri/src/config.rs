use clap::Parser;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::{fs::{File, OpenOptions}, io::{self, Write}, path::Path};
use tauri::State;
use crate::utils::AppSharedState;

#[derive(Debug, Parser)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    /// absolute path to config file
    #[arg(short, long, default_value = "./gimbal.conf")]
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
pub struct MissionTemplate {
    name: String,
    aircraft_location: Location,
    orientation: Orientation,
    target_location: Option<Location>,
    target_lock: bool
}

impl Default for MissionTemplate {
    fn default() -> Self {
        MissionTemplate { 
            name: "DEFAULT".to_string(),
            aircraft_location: Location::default(),
            orientation: Orientation::default(),
            target_location: None,
            target_lock: false
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(default)]
pub struct Config {
    pub stream_address: String,
    pub stream_port: String, 
    pub fps: i32,
    pub ion_access_token: Option<String>, 

    pub mission_templates: Vec<MissionTemplate>,

    // pub start_lat: f64,
    // pub start_lng: f64,
    // pub start_alt: u64,
    // pub start_speed: f64,
    // pub start_heading: u16,
    // pub target_lat: f64,
    // pub target_lng: f64,
    // pub target_lock: bool,
}



impl Default for Config {
    fn default() -> Self {
        Config {
            stream_address: "127.0.0.1".to_string(),
            stream_port: "15000".to_string(),
            fps: 30,
            ion_access_token: None,

            mission_templates: vec![
                MissionTemplate::default()
            ],

            // start_lat: 36.356553,
            // start_lng: -112.306541,
            // start_alt: 10000, // meters
            // start_speed: 75.0, // meters per second
            // start_heading: 0,

            // target_lat: 0.0,
            // target_lng: 0.0,
            // target_lock: false,

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
pub fn retrieve_config(state: State<AppSharedState>) -> Config {
    return state.config.clone()
}