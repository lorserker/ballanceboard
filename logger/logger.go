package logger

import (
	"log"
	"os"
)

var (
	infolog  *log.Logger
	warnlog  *log.Logger
	errorlog *log.Logger
)

func Info() *log.Logger {
	if infolog == nil {
		infolog = log.New(os.Stderr, "INFO: ", log.Ldate|log.Ltime)
	}
	return infolog
}

func Warn() *log.Logger {
	if warnlog == nil {
		warnlog = log.New(os.Stderr, "WARN: ", log.Ldate|log.Ltime)
	}
	return warnlog
}

func Error() *log.Logger {
	if errorlog == nil {
		errorlog = log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime)
	}
	return errorlog
}
