# Joystick Linux (ubuntu) integration

the baseline webkit browser doesn't have good support for non-standard controller inputs like joysticks. This guide will detail how to get a joystick supported by forcing it to be realized as an xbox controller. 

## Part 1. Dependencies 

required terminal dependencies
`lsbusb`
`xboxdrv`
`evtest`
`jstest`

```
sudo apt install -y xboxdrv evtest jstest
```

1. connect the joystick via USB and run the following to find the input device:

```
lsbusb
```

You should see something like: 

```
usb-Turtle_Beach_VelocityOne_Flightstick_75230861409294@A-event-joystick
```

Copy that output and save for a future step. 

Alternatively, you can run this to see what devices are recognized:

```
ls /dev/input/by-id
```

## Part 2. evtest & xboxdrv configuration

To determine what the controller is outputing to the system, we can use `evtest`

```
sudo evtest /dev/input/by-id/usb-Turtle_Beach_VelocityOne_Flightstick_75230861409294@A-event-joystick
```

After it is run, move the joystick/click some buttons. You should see a readout of what is clicked. 

```
Event: code 0 (ABS_X), value ...
Event: code 1 (ABS_Y), value ...
Event: code 304 (BTN_TRIGGER), value ...
```

You are interested in the things like `ABS_X`, `ABS_Y`, `BRN_TRIGER`

With the controller information you got from step 1 and the output you just got from `evtest`, you'll need to setup the a mapping using xboxdrv. This can be done in a bash script like this:

```
sudo xboxdrv \
	--evdev /dev/input/by-id/usb-Turtle_Beach_VelocityOne_Flightstick_75230861409294@A-event-joystick \
	--detach-kernel-driver \
	--silent \
	--evdev-absmap ABS_X=x2,ABS_Y=y2,ABS_RZ=y1,ABS_THROTTLE=rt \
	--evdev-keymap BTN_TRIGGER=a,BTN_THUMB=b,BTN_THUMB2=x,BTN_TOP=y,BTN_TRIGGER_HAPPY2=rb,BTN_DEAD=back,BTN_TRIGGER_HAPPY1=start,BTN_TOP2=du,BTN_PINKIE=dl,BTN_BASE=dl,BTN_BASE2=dr \
	--force-feedback
```

alternatively, you can setup a more static file like this:

`/etc/xboxdrv/my_controller.cfg`

```
[xboxdrv]
evdev = /dev/input/by-id/usb-Turtle_Beach_VelocityOne_Flightstick_75230861409294@A-event-joystick
silent = true
detach-kernel-driver = true

[evdev-absmap]
ABS_X = x1
ABS_Y = y1
ABS_Z = lt

[evdev-keymap]
BTN_TRIGGER = a
BTN_THUMB = b
BTN_TOP = x
BTN_PINKIE = y

```

Then run: 

```
sudo xboxdrv --config /etc/xboxdrv/my_controller.cfg
```

If it is successful, you will see something that says its has created virtual controllers at something like:

`/dev/input/js1`

## 3. Test and Confirmation

Once the mapping has initiated, it may take a little time for the controller to be recognized (~60 sec)

From the output of the last step, take the virtual controller and test it like this:

```
sudo jstest /dev/input/js1
```

## 4. Mapping Options:

The following are valid mapping options

### 🎮 Xbox 360 Controller Mapping Reference (for `xboxdrv`)

#### 🕹️ Axes (`--evdev-absmap`)
These map analog sticks and triggers.

| Xbox Name         | `xboxdrv` Axis Code | Purpose                    |
|-------------------|---------------------|----------------------------|
| Left Stick X      | `x1`                | Left/Right (horizontal)    |
| Left Stick Y      | `y1`                | Up/Down (vertical)         |
| Right Stick X     | `x2`                | Right analog horizontal    |
| Right Stick Y     | `y2`                | Right analog vertical      |
| Left Trigger      | `lt`                | Analog trigger (0 to 255)  |
| Right Trigger     | `rt`                | Analog trigger (0 to 255)  |
| D-Pad Left/Right  | `dpad_x`            | D-Pad horizontal axis      |
| D-Pad Up/Down     | `dpad_y`            | D-Pad vertical axis        |


#### 🔘 Buttons (`--evdev-keymap`)
These map physical buttons to Xbox face/utility buttons.

| Xbox Button        | `xboxdrv` Code |
|--------------------|----------------|
| A                  | `a`            |
| B                  | `b`            |
| X                  | `x`            |
| Y                  | `y`            |
| Left Bumper        | `lb`           |
| Right Bumper       | `rb`           |
| Back               | `back`         |
| Start              | `start`        |
| Xbox / Guide       | `guide`        |
| Left Stick Press   | `tl`           |
| Right Stick Press  | `tr`           |
| D-Pad Up           | `du`           |
| D-Pad Down         | `dd`           |
| D-Pad Left         | `dl`           |
| D-Pad Right        | `dr`           |
