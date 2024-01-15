/* NOTE: MISB601 Standards encoded per this document: https://upload.wikimedia.org/wikipedia/commons/1/19/MISB_Standard_0601.pdf */
use crate::cmd::data::Metadata;

pub enum KlvField {
    GenericString(String),
    PrecisionTimeStamp(u64),
    
    PlatformHeadingAngle(f64),
    PlatformPitchAngle(f64),
    PlatformRollAngle(f64),
    PlatformTrueAirSpeed(u8),

    SensorLatitude(f64),
}


pub trait KlvEncode {
    fn populate(klv: &mut Vec<u8>, val_bytes: &[u8]);
    fn to_klv(&self, key: u8) -> Vec<u8>;
}


impl KlvEncode for KlvField {
    fn populate(klv: &mut Vec<u8>, val_bytes: &[u8]) {
        klv.push(val_bytes.len() as u8);
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
                if val < 0.0 || val > 360.0 { val = 0.0 } 
                let scaling_factor = (u16::MAX as f64) / 360.0;
                let converted = (val * scaling_factor).round() as u16;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::PlatformPitchAngle(mut val) => {
                if val < -20.0 || val > 20.0 { val = 0.0 }
                let scaling_factor = (i16::MAX - 1) as f64 / 20.0;
                let converted = (val * scaling_factor).round() as i16;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::PlatformRollAngle(mut val) => {
                if val < -50.0 || val > 50.0 { val = 0.0 }
                let scaling_factor = (i16::MAX - 1) as f64 / 50.0;
                let converted = (val * scaling_factor).round() as i16;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::PlatformTrueAirSpeed(mut val) => {
                if val < 0 || val > 255 { val = 0 }
                let val_bytes = val.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            KlvField::SensorLatitude(mut val) => {
                if val < -90.0 || val > 90.0 { val = 0.0 }
                let scaling_factor = (2u32.pow(31) - 1) as f64 / 90.0;
                let converted = (val * scaling_factor).round() as i32;
                let val_bytes = converted.to_be_bytes();
                KlvField::populate(&mut klv, &val_bytes);
            }
            _ => {} // placeholder that does nothing. This should be remove to check for compliance
        }

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
    pub platformPitchAngle: KlvField, // 6
    pub platformRollAngle: KlvField, // 7
    pub platformTrueAirSpeed: KlvField, // 9

    pub sensorLatitude: KlvField,
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

            sensorLatitude: KlvField::SensorLatitude(json.sensorLatitude),
        }
    }

    pub fn encode_to_klv(&self) -> Vec<u8> {
        let mut klv_data = Vec::new();

        let universal_key = [0u8; 16];
        klv_data.extend_from_slice(&universal_key);

        klv_data.extend(self.precisionTimeStamp.to_klv(2));
        klv_data.extend(self.missionID.to_klv(3));
        klv_data.extend(self.platformTailNumber.to_klv(4));

        klv_data.extend(self.platformHeadingAngle.to_klv(4));
        klv_data.extend(self.platformPitchAngle.to_klv(5));
        klv_data.extend(self.platformRollAngle.to_klv(6));
        klv_data.extend(self.platformTrueAirSpeed.to_klv(7));

        klv_data.extend(self.platformDesignation.to_klv(10));
        klv_data.extend(self.imageSourceSensor.to_klv(11));
        klv_data.extend(self.imageCoordinateSystem.to_klv(12));
        
        klv_data.extend(self.sensorLatitude.to_klv(13));

        // klv_data.extend(self.precisionTimeStamp.to_klv(1));
        // klv_data.extend(self.missionID.to_klv(2));
        // klv_data.extend(self.platformTailNumber.to_klv(3));
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