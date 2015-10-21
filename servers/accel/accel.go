package main

import (
	"github.com/lorserker/ballanceboard/logger"
	"github.com/lorserker/ballanceboard/sensor/wimu"
	"github.com/lorserker/ballanceboard/wsock"
)

func main() {
	sens := wimu.New(":5555")
	err := sens.Start()
	if err != nil {
		logger.Error().Println("error starting sensor", err)
		return
	}

	wsServer := wsock.New("0.0.0.0:8000", "/ws", sens.Accelerometer)
	wsServer.Start()
}
