use std::sync::{Arc, Mutex};
use gstreamer_app as gst_app;
use serde::{Serialize, Deserialize};
use crate::config;

pub struct AppSharedState {
    pub video_appsrc: Arc<Mutex<gst_app::AppSrc>>,
    pub klv_appsrc: Arc<Mutex<gst_app::AppSrc>>,
    pub config: config::Config, 
}
