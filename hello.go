package main

import (
	"fmt"
	"github.com/lorserker/ballanceboard/logger"
	"github.com/lorserker/ballanceboard/sensor/wimu"
	"time"
)

func main() {
	sens := wimu.New(":5555")
	err := sens.Start()
	if err != nil {
		logger.Error().Println("error starting sensor", err)
		return
	}

	go func() {
		for {
			select {
			case acc := <-sens.Accelerometer:
				fmt.Printf("acc %#v\n", acc)
			case gyro := <-sens.Gyroscope:
				fmt.Printf("gyro %#v\n", gyro)
			case magn := <-sens.Magnetometer:
				fmt.Printf("magn %#v\n", magn)
			}
		}

	}()

	time.Sleep(60 * time.Second)

	sens.Done()
}
