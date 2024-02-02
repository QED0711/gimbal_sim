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
    file_path: String,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(default)]
pub struct Config {
    pub stream_address: String,
    pub stream_port: String, 
    pub start_lat: f64,
    pub start_lng: f64,
    pub start_alt: u64,
    pub start_speed: f64,
    pub start_heading: u16,
    pub target_lat: f64,
    pub target_lng: f64,
    pub target_lock: bool,
    pub ion_access_token: Option<String>, 
}

impl Default for Config {
    fn default() -> Self {
        Config {
            stream_address: "127.0.0.1".to_string(),
            stream_port: "15000".to_string(),

            start_lat: 36.356553,
            start_lng: -112.306541,
            start_alt: 10000, // meters
            start_speed: 75.0, // meters per second
            start_heading: 0,

            target_lat: 0.0,
            target_lng: 0.0,
            target_lock: false,

            ion_access_token: None,
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