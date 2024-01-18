use std::convert;

/* NOTE: MISB601 Standards encoded per this document: https://upload.wikimedia.org/wikipedia/commons/1/19/MISB_Standard_0601.pdf */
use crate::cmd::data::Metadata;

pub enum KlvField {
    GenericString(String),
    PrecisionTimeStamp(u64),

    PlatformHeadingAngle(f64),
    PlatformPitchAngle(f64),
    PlatformRollAngle(f64),
    PlatformTrueAirSpeed(u8),

    // These points cover the majority of lat/lng/alt transformations
    LatitudePoint(f64),
    LongitudePoint(f64),
    AltitudePoint(f64),

    SensorFOV(f64), // covers both hfov and vfov

    SensorRelativeAzimuthAngle(f64),
    SensorRelativeElevationAngle(f64),
    SensorRelativeRollAngle(f64),

    UasLocalSetVersionNumber(u8),
}

pub trait KlvEncode {
    fn populate(klv: &mut Vec<u8>, val_bytes: &[u8]);
    fn to_klv(&self, key: u8) -> Vec<u8>;
}

impl KlvEncode for KlvField {
    fn populate(klv: &mut Vec<u8>, val_bytes: &[u8]) {
        let length = val_bytes.len();
        if length < 128 {
            // BER Short Form
            klv.push(length as u8);
        } else {
            // BER Long Form
            let length_bytes = length.to_be_bytes();
            let significant_bytes = length_bytes.iter().skip_while(|&&x| x == 0).count();
            klv.push(0x80 | significant_bytes as u8);
            for &byte in length_bytes.iter().rev().take(significant_bytes) {
                klv.push(byte);
            }
        }
        klv.extend_from_slice(&val_bytes);
    }

    fn to_klv(&self, key: u8) -> Vec<u8> {
        let mut klv = vec![key];
        match self {
            KlvField::GenericString(val) => {
                let val_bytes = val.as_bytes();
                klv.push(val_bytes.len() as u8);
                klv.extend_from_slice(val_bytes);
            }
            KlvField::PrecisionTimeStamp(val) => {
                let val_bytes = val.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::PlatformHeadingAngle(mut val) => {
                if val < 0.0 || val > 360.0 {
                    val = 0.0
                }
                let scaling_factor = (u16::MAX as f64) / 360.0;
                let converted = (val * scaling_factor).round() as u16;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::PlatformPitchAngle(mut val) => {
                if val < -20.0 || val > 20.0 {
                    val = 0.0
                }
                let scaling_factor = (i16::MAX - 1) as f64 / 20.0;
                let converted = (val * scaling_factor).round() as i16;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::PlatformRollAngle(mut val) => {
                if val < -50.0 || val > 50.0 {
                    val = 0.0
                }
                let scaling_factor = (i16::MAX - 1) as f64 / 50.0;
                let converted = (val * scaling_factor).round() as i16;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::PlatformTrueAirSpeed(mut val) => {
                if val < 0 || val > 255 {
                    val = 0
                }
                let val_bytes = val.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::LatitudePoint(mut val) => {
                if val < -90.0 || val > 90.0 {
                    val = 0.0
                }
                let scaling_factor = (2u32.pow(31) - 1) as f64 / 90.0;
                let converted = (val * scaling_factor).round() as i32;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::LongitudePoint(mut val) => {
                if val < -180.0 || val > 180.0 {
                    val = 0.0
                }
                let scaling_factor = (2u32.pow(31) - 1) as f64 / 180.0;
                let converted = (val * scaling_factor).round() as i32;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::AltitudePoint(mut val) => {
                if val < -900.0 || val > 19_000.0 {
                    val = 0.0
                }
                let scale = 65535.0 / 19_900.0;
                let offset = -900.0 * scale;
                let converted = (val * scale + offset).round() as u16;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes)
            }
            KlvField::SensorFOV(mut val) => {
                if val < 0.0 || val > 180.0 {
                    val = 0.0
                }
                let scaling_factor = u16::MAX as f64 / 180.0;
                let converted = (val * scaling_factor).round() as u16;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::SensorRelativeAzimuthAngle(mut val) => {
                if val < 0.0 || val > 360.0 {
                    val = 0.0
                }
                let scaling_factor = u32::MAX as f64 / 360.0;
                let converted = (val * scaling_factor).round() as u32;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::SensorRelativeElevationAngle(mut val) => {
                if val < -180.0 || val > 180.0 {
                    val = 0.0
                }
                let scaling_factor = (2u32.pow(31) - 1) as f64 / 180.0;
                let converted = (val * scaling_factor).round() as i32;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::SensorRelativeRollAngle(mut val) => {
                if val < 0.0 || val > 360.0 {
                    val = 0.0
                }
                let scaling_factor = (u32::MAX as f64) / 360.0;
                let converted = (val * scaling_factor).round() as u32;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::UasLocalSetVersionNumber(mut val) => {
                if val < 0 || val > 255 { val = 0 }
                let val_bytes = val.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            _ => {} // placeholder that does nothing. This should be removed to check for completeness
        }
        println!("{:?}", klv);
        return klv;
    }
}

#[allow(non_snake_case)]
pub struct Klv {
    pub precisionTimeStamp: KlvField,
    pub missionID: KlvField,
    pub platformTailNumber: KlvField,

    pub platformDesignation: KlvField,
    pub imageSourceSensor: KlvField,
    pub imageCoordinateSystem: KlvField,

    pub platformHeadingAngle: KlvField, // 5
    pub platformPitchAngle: KlvField,   // 6
    pub platformRollAngle: KlvField,    // 7
    pub platformTrueAirSpeed: KlvField, // 9

    pub sensorLatitude: KlvField,     // 13
    pub sensorLongitude: KlvField,    // 14
    pub sensorTrueAltitude: KlvField, // 15

    pub sensorHFov: KlvField,
    pub sensorVFov: KlvField,

    pub sensorRelativeAzimuthAngle: KlvField,
    pub sensorRelativeElevationAngle: KlvField,
    pub sensorRelativeRollAngle: KlvField,

    pub frameCenterLatitude: KlvField,
    pub frameCenterLongitude: KlvField,
    pub frameCenterAltitude: KlvField,

    pub uasLocalSetVersionNumber: KlvField,
}

impl Klv {
    pub fn from(json: Metadata) -> Self {
        Klv {
            precisionTimeStamp: KlvField::PrecisionTimeStamp(json.precisionTimeStamp),
            missionID: KlvField::GenericString(json.missionID),
            platformTailNumber: KlvField::GenericString(json.platformTailNumber),

            platformHeadingAngle: KlvField::PlatformHeadingAngle(json.platformHeadingAngle),
            platformPitchAngle: KlvField::PlatformPitchAngle(json.platformPitchAngle),
            platformRollAngle: KlvField::PlatformRollAngle(json.platformRollAngle),
            platformTrueAirSpeed: KlvField::PlatformTrueAirSpeed(json.platformTrueAirSpeed),

            platformDesignation: KlvField::GenericString(json.platformDesignation),
            imageSourceSensor: KlvField::GenericString(json.imageSourceSensor),
            imageCoordinateSystem: KlvField::GenericString(json.imageCoordinateSystem),

            sensorLatitude: KlvField::LatitudePoint(json.sensorLatitude),
            sensorLongitude: KlvField::LongitudePoint(json.sensorLongitude),
            sensorTrueAltitude: KlvField::AltitudePoint(json.sensorTrueAltitude),

            sensorHFov: KlvField::SensorFOV(json.hfov), // both hfov and vfov have the same transformation applied, and so they can use the same enum
            sensorVFov: KlvField::SensorFOV(json.vfov),

            sensorRelativeAzimuthAngle: KlvField::SensorRelativeAzimuthAngle(
                json.sensorRelativeAzimuthAngle,
            ),
            sensorRelativeElevationAngle: KlvField::SensorRelativeElevationAngle(
                json.sensorRelativeElevationAngle,
            ),
            sensorRelativeRollAngle: KlvField::SensorRelativeRollAngle(
                json.sensorRelativeRollAngle,
            ),

            frameCenterLatitude: KlvField::LatitudePoint(json.frameCenterLatitude),
            frameCenterLongitude: KlvField::LongitudePoint(json.frameCenterLongitude),
            frameCenterAltitude: KlvField::AltitudePoint(json.frameCenterAltitude),

            uasLocalSetVersionNumber: KlvField::UasLocalSetVersionNumber(8),
        }
    }

    fn calc_checksum(klv: &Vec<u8>) -> u16 {
        let mut sum: u32 = 0;
        for &byte in klv {
            sum = (sum + byte as u32) % 65536;
        }
        sum as u16
    }

    pub fn encode_to_klv(&self) -> Vec<u8> {
        let mut klv_data = Vec::new();

        let universal_key = [
            0x06, 0x0E, 0x2B, 0x34, 0x02, 0x0B, 0x01, 0x01, 0x0E, 0x01, 0x03, 0x01, 0x01, 0x00,
            0x00, 0x00,
        ];
        klv_data.extend_from_slice(&universal_key);

        klv_data.extend(self.precisionTimeStamp.to_klv(2));
        klv_data.extend(self.missionID.to_klv(3));
        klv_data.extend(self.platformTailNumber.to_klv(4));

        klv_data.extend(self.platformHeadingAngle.to_klv(5));
        klv_data.extend(self.platformPitchAngle.to_klv(6));
        klv_data.extend(self.platformRollAngle.to_klv(7));
        klv_data.extend(self.platformTrueAirSpeed.to_klv(8));

        klv_data.extend(self.platformDesignation.to_klv(10));
        klv_data.extend(self.imageSourceSensor.to_klv(11));
        klv_data.extend(self.imageCoordinateSystem.to_klv(12));

        klv_data.extend(self.sensorLatitude.to_klv(13));
        klv_data.extend(self.sensorLongitude.to_klv(14));
        klv_data.extend(self.sensorTrueAltitude.to_klv(15));

        klv_data.extend(self.sensorHFov.to_klv(16));
        klv_data.extend(self.sensorVFov.to_klv(17));

        klv_data.extend(self.sensorRelativeAzimuthAngle.to_klv(18));
        klv_data.extend(self.sensorRelativeElevationAngle.to_klv(19));
        klv_data.extend(self.sensorRelativeRollAngle.to_klv(20));

        klv_data.extend(self.frameCenterLatitude.to_klv(23));
        klv_data.extend(self.frameCenterLongitude.to_klv(24));
        klv_data.extend(self.frameCenterAltitude.to_klv(25));

        klv_data.extend(self.uasLocalSetVersionNumber.to_klv(65));

        // Checksum (this portion must go at the end of the packet construction)
        klv_data.push(0x01); // checksum key
        klv_data.push(0x02); // checksum length (2 bytes)
        let checksum = Klv::calc_checksum(&klv_data);
        klv_data.extend_from_slice(&checksum.to_be_bytes());

        // klv_data.extend(self.precisionTimeStamp.to_klv(1));
        // klv_data.extend(self.missionID.to_klv(2));
        // klv_data.extend(self.platformTailNumber.to_klv(3));
        // klv_data.extend(self.platformIndicatedAirSpeed.to_klv(8));
        // klv_data.extend(self.platformDesignation.to_klv(9));
        // klv_data.extend(self.imageSourceSensor.to_klv(10));
        // klv_data.extend(self.imageCoordinateSystem.to_klv(11));

        // klv_data.extend(self.sensorLatitude.to_klv(13));

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
