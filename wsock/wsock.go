package wsock

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/lorserker/ballanceboard/logger"
	"github.com/lorserker/ballanceboard/sensor"
	"net/http"
	"time"
)

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     func(r *http.Request) bool { return true },
	}
)

type Server struct {
	addr       string
	pattern    string
	clientChan chan *websocket.Conn
	sensorChan chan *sensor.Measurement
}

func New(addr string, pattern string, sensorChan chan *sensor.Measurement) *Server {
	return &Server{
		addr:       addr,
		pattern:    pattern,
		clientChan: make(chan *websocket.Conn),
		sensorChan: sensorChan,
	}
}

func (s *Server) Start() {
	go s.passItAlong()

	http.HandleFunc(s.pattern, s.handleWsConnect)

	if err := http.ListenAndServe(s.addr, nil); err != nil {
		logger.Error().Println("error listening", err)
		return
	}
	logger.Info().Println("this should never happen :)")
}

func (s *Server) handleWsConnect(w http.ResponseWriter, r *http.Request) {
	logger.Info().Println("new request from", r.RemoteAddr)
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.Error().Println("upgrader error", err)
		return
	}
	s.clientChan <- ws
}

func (s *Server) passItAlong() {
	clients := make(map[string]*websocket.Conn)

	for {
		select {
		case ws := <-s.clientChan:
			// a new client has connected
			clientId := fmt.Sprintf("%s_%d", ws.RemoteAddr().String(), time.Now().UnixNano())
			logger.Info().Println("new ws client", clientId)

			clients[clientId] = ws
		case m := <-s.sensorChan:
			// we got a new measurement, pass it along to all clients
			//logger.Info().Printf("%#v\n", m)
			if m == nil {
				logger.Warn().Println("nil measurement received")
				for clientId, ws := range clients {
					if err := ws.Close(); err != nil {
						logger.Error().Println("error closing ws", clientId, err)
					}
				}
				return
			}
			mjson, err := json.Marshal(m)
			if err != nil {
				logger.Error().Println("error marshaling measurement")
			}
			for clientId, ws := range clients {
				go func() {
					if err := ws.WriteMessage(websocket.TextMessage, mjson); err != nil {
						logger.Error().Println("error writing message", clientId, err)
						delete(clients, clientId)

						logger.Info().Println("#clients", len(clients))

						if err := ws.Close(); err != nil {
							logger.Error().Println("error closing ws", clientId, err)
						}
					}
				}()
			}
		}
	}
}
