use super::super::utils;
use std::time::{SystemTime, UNIX_EPOCH};
use rand::Rng;
use tauri::State;
use gstreamer as gst;
use serde::Deserialize;

pub enum MISB601KlvField {
    GenericString(String),
    PrecisionTimeStamp(u64),
    SensorLatitude(f64),
}
pub trait KlvEncode {
    fn to_klv(&self, key: u8) -> Vec<u8>;
}

impl KlvEncode for MISB601KlvField {
    fn to_klv(&self, key: u8) -> Vec<u8> {
        let mut klv = vec![key];
        match self {
            MISB601KlvField::GenericString(val) => {
                let val_bytes = val.as_bytes();
                klv.push(val_bytes.len() as u8);
                klv.extend_from_slice(val_bytes);
            }
            MISB601KlvField::PrecisionTimeStamp(val) => {
                let val_bytes = val.to_be_bytes();
                klv.push(val_bytes.len() as u8);
                klv.extend_from_slice(&val_bytes);
            }
            MISB601KlvField::SensorLatitude(mut val) => {
                if val < -90.0 || val > 90.0 {
                    val = 0.0;
                }
                let scaling_factor = (2u32.pow(31) - 1) as f64 / 90.0;
                let converted = (val * scaling_factor).round() as i32;
                println!("INPUT: {val}; OUTPUT: {converted}");
                let val_bytes = converted.to_be_bytes();
                klv.push(val_bytes.len() as u8);
                klv.extend_from_slice(&val_bytes);
            }
            _ => {} // placeholder that does nothing. This should be remove to check for compliance
        }

        return klv;
    }
}



#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct Metadata {
    precisionTimeStamp: u64, // 2
    missionID: String, // 3
    platformTailNumber: String, // 4

    // platformHeadingAngle: KlvUInt16, // 5
    // platformPitchAngle: KlvInt16, // 6
    // platformRollAngle: KlvInt16, // 7

    // platformTrueAirSpeed: KlvUInt8, // 8
    // platformIndicatedAirSpeed: KlvUInt8, // 9

    platformDesignation: String, // 10
    imageSourceSensor: String,
    imageCoordinateSystem: String,

    sensorLatitude: f64, // 13
    // sensorLongitude: KlvFloat, // 14
    // sensorAltitude: KlvUInt16, // 15
    // frameCenterLatitude: KlvFloat,
    // frameCenterLongitude: KlvFloat,
    // frameCenterAltitude: KlvFloat,
    // sensorRelativeAzimuthAngle: KlvFloat,
    // sensorRelativeElevationAngle: KlvFloat,
    // sensorRelativeRollAngle: KlvFloat,
    // hfov: KlvFloat,
    // vfov: KlvFloat,
}

#[allow(non_snake_case)]
pub struct MISB601Klv {
    pub precisionTimeStamp: MISB601KlvField,
    pub missionID: MISB601KlvField,
    pub platformTailNumber: MISB601KlvField,

    pub platformDesignation: MISB601KlvField,
    pub imageSourceSensor: MISB601KlvField,
    pub imageCoordinateSystem: MISB601KlvField,


    pub sensorLatitude: MISB601KlvField,
}

impl MISB601Klv {

    pub fn from(json: Metadata) -> Self {
        MISB601Klv {
            precisionTimeStamp: MISB601KlvField::PrecisionTimeStamp(json.precisionTimeStamp),
            missionID: MISB601KlvField::GenericString(json.missionID),
            platformTailNumber: MISB601KlvField::GenericString(json.platformTailNumber),
            
            platformDesignation: MISB601KlvField::GenericString(json.platformDesignation),
            imageSourceSensor: MISB601KlvField::GenericString(json.imageSourceSensor),
            imageCoordinateSystem: MISB601KlvField::GenericString(json.imageCoordinateSystem),

            sensorLatitude: MISB601KlvField::SensorLatitude(json.sensorLatitude),
        }
    }

    pub fn encode_to_klv(&self) -> Vec<u8> {
        let mut klv_data = Vec::new();

        let universal_key = [0u8; 16];
        klv_data.extend_from_slice(&universal_key);

        klv_data.extend(self.precisionTimeStamp.to_klv(2));
        klv_data.extend(self.missionID.to_klv(3));
        klv_data.extend(self.platformTailNumber.to_klv(4));

        klv_data.extend(self.platformDesignation.to_klv(10));
        klv_data.extend(self.imageSourceSensor.to_klv(11));
        klv_data.extend(self.imageCoordinateSystem.to_klv(12));
        
        klv_data.extend(self.sensorLatitude.to_klv(13));

        // klv_data.extend(self.precisionTimeStamp.to_klv(1));
        // klv_data.extend(self.missionID.to_klv(2));
        // klv_data.extend(self.platformTailNumber.to_klv(3));
        // klv_data.extend(self.platformHeadingAngle.to_klv(4));
        // klv_data.extend(self.platformPitchAngle.to_klv(5));
        // klv_data.extend(self.platformRollAngle.to_klv(6));
        // klv_data.extend(self.platformTrueAirSpeed.to_klv(7));
        // klv_data.extend(self.platformIndicatedAirSpeed.to_klv(8));
        // klv_data.extend(self.platformDesignation.to_klv(9));
        // klv_data.extend(self.imageSourceSensor.to_klv(10));
        // klv_data.extend(self.imageCoordinateSystem.to_klv(11));

        // klv_data.extend(self.sensorLatitude.to_klv(13));
        // klv_data.extend(self.sensorLongitude.to_klv(14));
        // klv_data.extend(self.sensorAltitude.to_klv(15));

        // klv_data.extend(self.frameCenterLatitude.to_klv(15));
        // klv_data.extend(self.frameCenterLongitude.to_klv(16));
        // klv_data.extend(self.frameCenterAltitude.to_klv(17));
        // klv_data.extend(self.sensorRelativeAzimuthAngle.to_klv(18));
        // klv_data.extend(self.sensorRelativeElevationAngle.to_klv(19));
        // klv_data.extend(self.sensorRelativeRollAngle.to_klv(20));

        // klv_data.extend(self.hfov.to_klv(16));
        // klv_data.extend(self.vfov.to_klv(17));

        klv_data
    }
}

#[tauri::command]
pub fn send_packet(state: State<utils::AppSharedState>, image_arr: Vec<u8>, metadata: Metadata) {
    // println!("{:?}", metadata);
    // let klv = generate_fake_klv_data(32);
    let klv_metadata = MISB601Klv::from(metadata);
    let klv = klv_metadata.encode_to_klv();

    let video_appsrc = state.video_appsrc.lock().unwrap();
    let klv_appsrc = state.klv_appsrc.lock().unwrap();
    
    let mut image_buf = gst::Buffer::with_size(image_arr.len()).expect("Failed to create image gst buffer");
    timestamp_buffer(&mut image_buf, &image_arr);

    let mut klv_buf = gst::Buffer::with_size(klv.len()).expect("Failed to create klv gst buffer");
    timestamp_buffer(&mut klv_buf, &klv);
    
    video_appsrc.push_buffer(image_buf).expect("Failed to push to image buffer");
    klv_appsrc.push_buffer(klv_buf).expect("Failed to push to klv buffer");
}


// #[allow(dead_code)]
fn timestamp_buffer(buffer: &mut gst::Buffer, data: &Vec<u8>){
    let buffer = buffer.get_mut().unwrap();
    let _ = buffer.copy_from_slice(0, data);

    let now = SystemTime::now().duration_since(UNIX_EPOCH)
        .expect("Time went backwards");

    // let now = TIMESTAMP_COUNTER.fetch_add(BUFFER_DURATION_MS, Ordering::SeqCst);
    let pts = gst::ClockTime::from_mseconds(now.as_millis() as u64);
    // let pts = gst::ClockTime::from_mseconds(now);
    buffer.set_pts(pts);
    buffer.set_dts(pts);
    buffer.set_duration(pts);
    buffer.set_offset(now.as_millis() as u64);

    // buffer.set_dts(pts + gst::ClockTime::from_mseconds(BUFFER_DURATION_MS));
    // buffer.set_duration(gst::ClockTime::from_mseconds(BUFFER_DURATION_MS));
}


fn generate_fake_klv_data(value_length: usize) -> Vec<u8> {
    let mut rng = rand::thread_rng();

    // Generate a fixed 16-byte key (UUID)
    let key: [u8; 16] = [
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
    ];

    // Generate a random value of the specified length
    let value: Vec<u8> = (0..value_length).map(|_| rng.gen()).collect();

    // Length field
    let length: Vec<u8> = vec![value_length as u8];

    // Combine key, length, and value into a single Vec<u8>
    [key.to_vec(), length, value].concat()
}