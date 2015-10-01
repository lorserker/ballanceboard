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
		for m := range sens.Accelerometer {
			fmt.Printf("%#v\n", m)
		}
	}()

	// we stop the sensor ahead of time
	go func() {
		<-time.After(10 * time.Second)
		sens.Done()
	}()

	time.Sleep(20 * time.Second)
}
