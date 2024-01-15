use crate::cmd::data::Metadata;

pub enum KlvField {
    GenericString(String),
    PrecisionTimeStamp(u64),
    SensorLatitude(f64),
}


pub trait KlvEncode {
    fn to_klv(&self, key: u8) -> Vec<u8>;
}


impl KlvEncode for KlvField {
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
                klv.push(val_bytes.len() as u8);
                klv.extend_from_slice(&val_bytes);
            }
            KlvField::SensorLatitude(mut val) => {
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


#[allow(non_snake_case)]
pub struct Klv {
    pub precisionTimeStamp: KlvField,
    pub missionID: KlvField,
    pub platformTailNumber: KlvField,

    pub platformDesignation: KlvField,
    pub imageSourceSensor: KlvField,
    pub imageCoordinateSystem: KlvField,


    pub sensorLatitude: KlvField,
}


impl Klv {

    pub fn from(json: Metadata) -> Self {
        Klv {
            precisionTimeStamp: KlvField::PrecisionTimeStamp(json.precisionTimeStamp),
            missionID: KlvField::GenericString(json.missionID),
            platformTailNumber: KlvField::GenericString(json.platformTailNumber),
            
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