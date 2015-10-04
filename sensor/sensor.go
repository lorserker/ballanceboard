package sensor

const ACCELEROMETER = "accelerometer"
const GYROSCOPE = "gyroscope"
const MAGNETOMETER = "magnetometer"

type Measurement struct {
	Type string
	From string

	X float64
	Y float64
	Z float64
}
