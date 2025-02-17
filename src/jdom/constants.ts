// Registers 0x001-0x07f - r/w common to all services
// Registers 0x080-0x0ff - r/w defined per-service
// Registers 0x100-0x17f - r/o common to all services
// Registers 0x180-0x1ff - r/o defined per-service
// Registers 0x200-0xeff - custom, defined per-service
// Registers 0xf00-0xfff - reserved for implementation, should not be on the wire

export const CMD_GET_REG = 0x1000
export const CMD_SET_REG = 0x2000

export const CMD_EVENT_MASK = 0x8000
export const CMD_EVENT_CODE_MASK = 0x00ff
export const CMD_EVENT_COUNTER_POS = 8
export const CMD_EVENT_COUNTER_MASK = 0x7f

export const CMD_TOP_MASK = 0xf000
export const CMD_REG_MASK = 0x0fff

export const ACK_MIN_DELAY = 90
export const ACK_MAX_DELAY = 120

// Commands 0x000-0x07f - common to all services
// Commands 0x080-0xeff - defined per-service
// Commands 0xf00-0xfff - reserved for implementation
// enumeration data for CTRL, ad-data for other services
export const CMD_ADVERTISEMENT_DATA = 0x00

export const PIPE_PORT_SHIFT = 7
export const PIPE_COUNTER_MASK = 0x001f
export const PIPE_CLOSE_MASK = 0x0020
export const PIPE_METADATA_MASK = 0x0040

export const JD_SERIAL_HEADER_SIZE = 16
export const JD_SERIAL_MAX_PAYLOAD_SIZE = 236
export const JD_SERVICE_INDEX_MASK = 0x3f
export const JD_SERVICE_INDEX_INV_MASK = 0xc0
export const JD_SERVICE_INDEX_CRC_ACK = 0x3f
export const JD_SERVICE_INDEX_PIPE = 0x3e
export const JD_SERVICE_INDEX_MAX_NORMAL = 0x30
export const JD_SERVICE_INDEX_CTRL = 0x00
export const JD_SERVICE_INDEX_BROADCAST = 0x3d

// the COMMAND flag signifies that the device_identifier is the recipent
// (i.e., it's a command for the peripheral); the bit clear means device_identifier is the source
// (i.e., it's a report from peripheral or a broadcast message)
export const JD_FRAME_FLAG_COMMAND = 0x01
// an ACK should be issued with CRC of this package upon reception
export const JD_FRAME_FLAG_ACK_REQUESTED = 0x02
// the device_identifier contains target service class number
export const JD_FRAME_FLAG_IDENTIFIER_IS_SERVICE_CLASS = 0x04
export const JD_FRAME_FLAG_LOOPBACK = 0x40
export const JD_FRAME_FLAG_VNEXT = 0x80

export const JD_DEVICE_IDENTIFIER_BROADCAST_HIGH_MARK = 0xaaaaaaaa

export const JD_ADVERTISEMENT_0_COUNTER_MASK = 0x0000000f
export const JD_ADVERTISEMENT_0_ACK_SUPPORTED = 0x00000100

// time withouth seeing a package to be considered "lost", 2x announce interval
export const JD_DEVICE_LOST_DELAY = 1500
// time without seeing a packet to be considered "disconnected"
export const JD_DEVICE_DISCONNECTED_DELAY = 3000

export const RESET_IN_TIME_US = 2000000

export const MAX_SERVICES_LENGTH = 59

export const NEW_LISTENER = "newListener"
export const REMOVE_LISTENER = "removeListener"

export const CONNECTION_STATE = "connectionState"
export const CONNECT = "connect"
export const LOST = "lost"
export const FOUND = "found"
export const CONNECTING = "connecting"
export const DISCONNECT = "disconnect"
export const DISCONNECTING = "disconnecting"
export const ANNOUNCE = "announce"
export const START = "start"
export const RESTART = "restart"
export const STOP = "stop"
export const CHANGE = "change"
export const EVENT = "event"
export const RENDER = "render"
export const REFRESH = "refresh"
export const MESSAGE = "message"
export const FIRMWARE_BLOBS_CHANGE = "firmwareBlobsChange"
export const LATE = "late"
export const GET_ATTEMPT = "getAttempt"
export const SERVICE_CLIENT_ADDED = `serviceClientAdded`
export const SERVICE_CLIENT_REMOVED = `serviceClientRemoved`
export const READING_SENT = "readingSent"
export const ROLE_CHANGE = "roleChange"
export const ROLE_MANAGER_CHANGE = "roleManagerChange"

export const SERVICE_PROVIDER_ADDED = `serviceProviderAdded`
export const SERVICE_PROVIDER_REMOVED = `serviceProviderRemoved`

export const IDENTIFY = "identify"
export const IDENTIFY_DURATION = 2000
export const RESET = "reset"

export const DATA = "data"
export const CLOSE = "close"

export const DEVICE_CONNECT = "deviceConnect"
export const DEVICE_LOST = "deviceLost"
export const DEVICE_FOUND = "deviceFound"
export const DEVICE_DISCONNECT = "deviceDisconnect"
export const DEVICE_ANNOUNCE = "deviceAnnounce"
export const DEVICE_PACKET_ANNOUNCE = "devicePacketAnnounce"
export const DEVICE_RESTART = "deviceRestart"
export const DEVICE_CHANGE = "deviceChange"
export const DEVICE_FIRMWARE_INFO = "firmwareInfo"
export const DEVICE_CLEAN = "deviceClean"
export const SELF_ANNOUNCE = "selfAnnounce"

export const PACKET_SEND = "packetSend"
export const FRAME_SEND_DISCONNECT = "frameSendDisconnect"

export const PACKET_PRE_PROCESS = "packetPreProcess"
export const PACKET_PROCESS = "packetProcess"
export const PACKET_RECEIVE = "packetReceive"
export const PACKET_RECEIVE_ANNOUNCE = "packetReceiveAnnounce"
export const PACKET_RECEIVE_NO_DEVICE = "packetReceiveNoDevice"
export const PACKET_EVENT = "packetEvent"
export const PACKET_REPORT = "packetReport"
export const PACKET_ANNOUNCE = "packetAnnounce"
export const PACKET_INVALID_CRC = "packetInvalidCrc"
export const PACKET_INVALID_DATA = "packetInvalidData"
export const PACKET_DATA_NORMALIZE = "packetDataNormalize"

export const FRAME_PROCESS = "frameProcess"
export const FRAME_SEND = "frameSend"

export const REPORT_RECEIVE = "reportReceive"
export const REPORT_UPDATE = "reportUpdate"
export const COMMAND_RECEIVE = "commandReceive"

export const ERROR = "error"
export const PANIC = "panic"
export const TRACE = "trace"
export const TIMEOUT = "timeout"
export const TIMEOUT_DISCONNECT = "timeoutDisconnect"
export const GLOBALS_UPDATED = "globalsUpdated"

export const STATE_CHANGE = "stateChange"

export const PROGRESS = "progress"

export const PACKET_KIND_RW = "rw"
export const PACKET_KIND_RO = "ro"
export const PACKET_KIND_EVENT = "event"
export const PACKET_KIND_ANNOUNCE = "announce"

export const REGISTER_NODE_NAME = "register"
export const REPORT_NODE_NAME = "report"
export const CONST_NODE_NAME = "const"
export const EVENT_NODE_NAME = "event"
export const SERVICE_NODE_NAME = "service"
export const SERVICE_MIXIN_NODE_NAME = "serviceMixin"
export const DEVICE_NODE_NAME = "device"
export const VIRTUAL_DEVICE_NODE_NAME = "virtualdevice"
export const BUS_NODE_NAME = "bus"
export const COMMAND_NODE_NAME = "command"
export const FIELD_NODE_NAME = "field"
export const PIPE_NODE_NAME = "pipe"
export const PIPE_REPORT_NODE_NAME = "pipe_report"
export const CRC_ACK_NODE_NAME = "crcAck"
export const SERVICE_TEST_NODE_NAME = "serviceTest"

export const REGISTER_REFRESH_TIMEOUT = 150
export const REGISTER_REFRESH_RETRY_0 = 30
export const REGISTER_REFRESH_RETRY_1 = 80
export const REGISTER_POLL_STREAMING_INTERVAL = 5000
export const REGISTER_POLL_FIRST_REPORT_INTERVAL = 400
export const REGISTER_POLL_REPORT_INTERVAL = 5001
export const REGISTER_POLL_REPORT_MAX_INTERVAL = 60000
export const REGISTER_POLL_REPORT_VOLATILE_INTERVAL = 1000
export const REGISTER_POLL_REPORT_VOLATILE_MAX_INTERVAL = 5000
export const REGISTER_OPTIONAL_POLL_COUNT = 3
export const STREAMING_DEFAULT_INTERVAL = 50

export const FLASH_MAX_DEVICES = 6

export const PING_LOGGERS_POLL = 2400
export const ROLE_MANAGER_POLL = 1500
export const REFRESH_REGISTER_POLL = 50

export const USB_TRANSPORT = "usb"
export const BLUETOOTH_TRANSPORT = "bluetooth"
export const SERIAL_TRANSPORT = "serial"
export const PACKETIO_TRANSPORT = "packetio"
export const WEBSOCKET_TRANSPORT = "web"
export const NODESOCKET_TRANSPORT = "tcp"

export const HF2_TIMEOUT = 1000

export const META_ACK = "ACK"
export const META_ACK_FAILED = "ACK_FAILED"
export const META_PIPE = "PIPE"
export const META_GET = "GET"
export const META_TRACE = "TRACE"
export const META_TRACE_DESCRIPTION = "TRACE_DESCRIPTION"
export const META_NOT_IMPLEMENTED = "NOT_IMPLEMENTED"

export const REGISTER_PRE_GET = "registerPreGet"

export const TRACE_FILTER_HORIZON = 100
export const EMBED_MIN_ASPECT_RATIO = 1.22

export const BLUETOOTH_JACDAC_SERVICE = "f8530001-a97f-49f5-a554-3e373fbea2d5"
export const BLUETOOTH_JACDAC_RX_CHARACTERISTIC =
    "f8530002-a97f-49f5-a554-3e373fbea2d5"
export const BLUETOOTH_JACDAC_TX_CHARACTERISTIC =
    "f8530003-a97f-49f5-a554-3e373fbea2d5"
export const BLUETOOTH_JACDAC_DIAG_CHARACTERISTIC =
    "f8530004-a97f-49f5-a554-3e373fbea2d5"

export const TRANSPORT_CONNECT_RETRY_DELAY = 500
export const TRANSPORT_PULSE_TIMEOUT = 60000 // don't interfere with manual flashing of devices

export const ERROR_TRANSPORT_DEVICE_LOCKED = "transport/device-locked"

export const ROLE_BOUND = "roleBound"
export const ROLE_UNBOUND = "roleUnbound"
export const ROLE_HAS_NO_SERVICE = "roleHasNoService"
export const BOUND = "bound"
export const UNBOUND = "unbound"

export const JACDAC_ERROR = "JacdacError"
export const ERROR_TIMEOUT = "timeout"
export const ERROR_TRANSPORT_CLOSED = "transport/closed"
export const ERROR_MICROBIT_V1 = "microbit/v1-not-supported"
export const ERROR_MICROBIT_UNKNOWN = "microbit/unknown-hardware-revision"
export const ERROR_MICROBIT_JACDAC_MISSING = "microbit/jacdac-missing"
export const ERROR_MICROBIT_INVALID_MEMORY = "microbit/invalid-memory"
export const ERROR_TRANSPORT_HF2_NOT_SUPPORTED = "transport/hf2-not-supported"
export const ERROR_NO_ACK = "no-ack"

export const ROLE_QUERY_SERVICE_OFFSET = "srvo"
export const ROLE_QUERY_SERVICE_INDEX = "srvi"
export const ROLE_QUERY_DEVICE = "dev"
export const ROLE_QUERY_SELF_DEVICE = "self"

// eslint-disable-next-line prefer-const
export let DOCS_ROOT = "https://microsoft.github.io/jacdac-docs/"

export * from "../../jacdac-spec/dist/specconstants"
