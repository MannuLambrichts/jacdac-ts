import { MatrixKeypadReg, SRV_MATRIX_KEYPAD } from "../jdom/constants"
import { JDRegisterServer } from "../jdom/servers/registerserver"
import { SensorServer } from "./sensorserver"

export class MatrixKeypadServer extends SensorServer<[[number][]]> {
    readonly rows: JDRegisterServer<[number]>
    readonly columns: JDRegisterServer<[number]>
    readonly labels: JDRegisterServer<[[string][]]>

    constructor(columns: number, rows: number, labels?: string[]) {
        super(SRV_MATRIX_KEYPAD, {
            readingValues: [[]],
        })

        this.columns = this.addRegister(MatrixKeypadReg.Columns, [columns])
        this.rows = this.addRegister(MatrixKeypadReg.Rows, [rows])
        this.labels = this.addRegister(
            MatrixKeypadReg.Labels,
            labels ? [labels.map(l => [l])] : undefined
        )
    }

    async down(button: number) {
        const [values] = this.reading.values()
        const valuei = values.findIndex(v => v[0] === button)
        if (valuei < 0) {
            values.push([button])
            this.reading.setValues([values])
        }
    }

    async up(button: number) {
        const [values] = this.reading.values()
        const valuei = values.findIndex(v => v[0] === button)
        if (valuei > -1) {
            values.splice(valuei, 1)
            this.reading.setValues([values])
        }
    }
}
