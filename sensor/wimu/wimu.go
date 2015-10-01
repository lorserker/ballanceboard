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
	"sync"
	"time"
)

const N_BUFFER int = 128
const SEND_TIMEOUT int = 200

type Sensor struct {
	Accelerometer chan *sensor.Measurement
	Gyroscope     chan *sensor.Measurement
	Magnetometer  chan *sensor.Measurement

	wg sync.WaitGroup

	port string
	conn *net.UDPConn

	done          chan struct{}
	doneUdpServer chan struct{}
}

func New(port string) *Sensor {
	accelChan := make(chan *sensor.Measurement, N_BUFFER)
	gyroChan := make(chan *sensor.Measurement, N_BUFFER)
	magnetChan := make(chan *sensor.Measurement, N_BUFFER)
	doneChan := make(chan struct{})
	doneUdpServerChan := make(chan struct{})

	return &Sensor{
		Accelerometer: accelChan,
		Gyroscope:     gyroChan,
		Magnetometer:  magnetChan,
		port:          port,
		conn:          nil,
		done:          doneChan,
		doneUdpServer: doneUdpServerChan,
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

	datachan := sens.readData()

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
		sens.send(&sensor.Measurement{From: ip, X: x, Y: y, Z: z}, sens.Accelerometer)

		if len(cols) >= 9 {
			x, y, z, err = parseXYZ(cols[6:9])
			if err != nil {
				return err
			}
			sens.send(&sensor.Measurement{From: ip, X: x, Y: y, Z: z}, sens.Gyroscope)

			if len(cols) >= 13 {
				x, y, z, err = parseXYZ(cols[10:13])
				if err != nil {
					return err
				}
				sens.send(&sensor.Measurement{From: ip, X: x, Y: y, Z: z}, sens.Magnetometer)
			}
		}
	}
	return nil
}

func (sens *Sensor) send(m *sensor.Measurement, c chan *sensor.Measurement) {
	sens.wg.Add(1)
	go func() {
		defer sens.wg.Done()

		select {
		case c <- m:
			return
		case <-time.After(time.Duration(SEND_TIMEOUT) * time.Millisecond):
			return
		}
	}()
}

func (sens *Sensor) handleDone() error {
	// we wait for all pending sends to happen
	sens.wg.Wait()
	// we close the udp server
	sens.doneUdpServer <- struct{}{}
	if err := sens.conn.Close(); err != nil {
		logger.Error().Println("error closing UDP connection", err)
		return err
	}
	// we close the channels
	close(sens.Accelerometer)
	close(sens.Gyroscope)
	close(sens.Magnetometer)
	return nil
}

type res struct {
	From *net.UDPAddr
	Data []byte
}

func (sens *Sensor) readData() chan res {
	output := make(chan res, N_BUFFER)

	go func() {
		buf := make([]byte, 1024)
		for {
			select {
			case <-sens.doneUdpServer:
				return
			default:
				n, addr, err := sens.conn.ReadFromUDP(buf)
				if err != nil {
					logger.Error().Println("error reading from udp", err)
					return
				}
				output <- res{From: addr, Data: buf[:n]}
			}
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
