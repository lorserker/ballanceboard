package main

import (
	"fmt"
	"github.com/lorserker/ballanceboard/logger"
	"net"
)

func main() {
	fmt.Println("Hello Ballance!")

	serverAddr, err := net.ResolveUDPAddr("udp", ":5555")
	if err != nil {
		logger.Error().Println("error creating UDP address", err)
	}

	conn, err := net.ListenUDP("udp", serverAddr)
	if err != nil {
		logger.Error().Println("error listening to UDP", err)
	}
	defer conn.Close()

	buf := make([]byte, 1024)

	for {
		n, _, err := conn.ReadFromUDP(buf)
		fmt.Println(string(buf[0:n]))

		if err != nil {
			logger.Error().Println("error reading", err)
		}
	}
}
