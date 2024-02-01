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
pub struct Config {
    start_lat: f64,
    start_lng: f64
}

pub fn parse_config() -> Config {
    let args = Args::parse();

    let path = Path::new(&args.file_path);
    if !path.exists() {
        let default = Config {
            start_lat: 0.0,
            start_lng: 0.0,
        };
    
        let mut file = File::create(path).expect("could not create file at path");

        let contents = serde_yaml::to_string(&default).expect("could not instantiate default config contents");
        file.write_all(contents.as_bytes()).expect("could not write default values to file");
        
        return default; 
    } else {
        let file = File::open(path).expect("could not open file at path");
        let config = serde_yaml::from_reader(file).expect("could not read config file at path");

        return config;
    }
}

#[tauri::command]
pub fn retrieve_config(state: State<AppSharedState>) -> Config {
    return state.config.clone()
}