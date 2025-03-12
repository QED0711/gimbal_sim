use tauri::State;
use chrono::{DateTime, Duration, Utc};
use crate::cot::sender::{UdpSenderHandle, CotUdpCommand};

#[tauri::command]
pub fn send_cot_message(data: CotData, udp_sender: State<UdpSenderHandle>) {
    // Convert UI data into a valid CoT XML string.
    // println!("COT DATA: {:?}", data);

    let xml_message = create_cot_xml(&data);
    let sender = udp_sender.0.lock().unwrap();
    sender.send(CotUdpCommand::SendCoTMessage(xml_message))
        .expect("Failed to send CoT message");    
}

#[derive(Debug, serde::Deserialize)]
pub struct CotData {
    pub lat: f64,
    pub lng: f64,
    pub alt: f64,
    pub name: String,
}

/// Converts the provided CotData into a valid Cursor on Target (CoT) XML string.
pub fn create_cot_xml(data: &CotData) -> String {
    let now: DateTime<Utc> = Utc::now();
    let time_str = now.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string();  // Fix format
    let stale_str = (now + Duration::minutes(5)).format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string();

    let uid = format!("{}", data.name);

    format!(
        r#"<event version="2.0" uid="{uid}" type="a-f-G-U-C" how="m-g" time="{time_str}" start="{time_str}" stale="{stale_str}">
    <point lat="{lat}" lon="{lng}" hae="{alt}" ce="9999.0" le="9999.0"/>
    <detail>
      <contact callsign="{name}" />
    </detail>
</event>"#,
        uid = uid,
        time_str = time_str,
        stale_str = stale_str,
        lat = data.lat,
        lng = data.lng,
        alt = data.alt,
        name = data.name,
    )
}
