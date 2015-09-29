package wimu

// this package handles the parsing of the output of the Wireless IMU app
// https://play.google.com/store/apps/details?id=org.zwiener.wimu

import (
	"errors"
	"github.com/lorserker/ballanceboard/logger"
	"github.com/lorserker/ballanceboard/sensor"
	"net"
	"strconv"
	"strings"
)

const N_BUFFER int = 128

type Sensor struct {
	Accelerometer chan sensor.Measurement
	Gyroscope     chan sensor.Measurement
	Magnetometer  chan sensor.Measurement

	port string
	conn *net.UDPConn

	done chan struct{}
}

func New(port string) *Sensor {
	accelChan := make(chan sensor.Measurement, N_BUFFER)
	gyroChan := make(chan sensor.Measurement, N_BUFFER)
	magnetChan := make(chan sensor.Measurement, N_BUFFER)
	doneChan := make(chan struct{})

	return &Sensor{
		Accelerometer: accelChan,
		Gyroscope:     gyroChan,
		Magnetometer:  magnetChan,
		port:          port,
		conn:          nil,
		done:          doneChan,
	}
}

func (sens *Sensor) Start() error {
	serverAddr, err := net.ResolveUDPAddr("udp", sens.port)
	if err != nil {
		logger.Error().Println("error creating UDP address", err)
		return err
	}

	conn, err := net.ListenUDP("udp", serverAddr)
	if err != nil {
		logger.Error().Println("error listening to UDP", err)
		return err
	}
	sens.conn = conn

	logger.Info().Println("connection created")

	datachan := readData(conn)

	go func() {
		for {
			select {
			case data := <-datachan:
				sens.handleData(data)
			case <-sens.done:
				sens.handleDone()
				return
			}
		}
	}()

	return nil
}

func (sens *Sensor) Done() {
	sens.done <- struct{}{}
}

func (sens *Sensor) handleData(data res) error {
	if data.From == nil {
		return errors.New("data.From is nil")
	}
	ip := data.From.IP.String()

	cols := strings.Split(string(data.Data), ",")
	if len(cols) < 5 {
		return errors.New("unexpected data format " + string(data.Data))
	}
	if len(cols) >= 5 {
		x, y, z, err := parseXYZ(cols[2:5])
		if err != nil {
			return err
		}
		sens.Accelerometer <- sensor.Measurement{From: ip, X: x, Y: y, Z: z}

		if len(cols) >= 9 {
			x, y, z, err = parseXYZ(cols[6:9])
			if err != nil {
				return err
			}
			sens.Gyroscope <- sensor.Measurement{From: ip, X: x, Y: y, Z: z}

			if len(cols) >= 13 {
				x, y, z, err = parseXYZ(cols[10:13])
				if err != nil {
					return err
				}
				sens.Magnetometer <- sensor.Measurement{From: ip, X: x, Y: y, Z: z}
			}
		}
	}
	return nil
}

func (sens *Sensor) handleDone() error {
	if err := sens.conn.Close(); err != nil {
		logger.Error().Println("error closing UDP connection", err)
		return err
	}
	close(sens.Accelerometer)
	close(sens.Gyroscope)
	close(sens.Magnetometer)
	return nil
}

type res struct {
	From *net.UDPAddr
	Data []byte
}

func readData(conn *net.UDPConn) chan res {
	output := make(chan res, N_BUFFER)

	go func() {
		buf := make([]byte, 1024)
		for {
			n, addr, err := conn.ReadFromUDP(buf)
			if err != nil {
				logger.Error().Println("error reading from udp", err)
				return
			}
			output <- res{From: addr, Data: buf[:n]}
		}
	}()

	return output
}

func parseXYZ(vals []string) (float64, float64, float64, error) {
	if len(vals) != 3 {
		return 0.0, 0.0, 0.0, errors.New("three values expected")
	}

	x, err := strconv.ParseFloat(strings.TrimSpace(vals[0]), 64)
	if err != nil {
		logger.Error().Println("cannot parse float", vals[0])
		return 0.0, 0.0, 0.0, err
	}
	y, err := strconv.ParseFloat(strings.TrimSpace(vals[1]), 64)
	if err != nil {
		logger.Error().Println("cannot parse float", vals[1])
		return 0.0, 0.0, 0.0, err
	}
	z, err := strconv.ParseFloat(strings.TrimSpace(vals[2]), 64)
	if err != nil {
		logger.Error().Println("cannot parse float", vals[2])
		return 0.0, 0.0, 0.0, err
	}

	return x, y, z, nil
}
