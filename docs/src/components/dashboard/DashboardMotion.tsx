
import React from "react";
import { DashboardServiceProps } from "./DashboardServiceWidget";
import { useRegisterUnpackedValue } from "../../jacdac/useRegisterValue";
import useWidgetSize from "../widgets/useWidgetSize";
import useServiceHost from "../hooks/useServiceHost";
import { SvgWidget } from "../widgets/SvgWidget";
import { MotionReg } from "../../../../src/jacdac";
import useWidgetTheme from "../widgets/useWidgetTheme";
import useSvgButtonProps from "../hooks/useSvgButtonProps";
import SensorServiceHost from "../../../../src/hosts/sensorservicehost";

export default function DashboardButton(props: DashboardServiceProps) {
  const { service, services, variant } = props;
  const movingRegister = service.register(MotionReg.Moving);
  const [moving] = useRegisterUnpackedValue<[boolean]>(movingRegister);
  const widgetSize = useWidgetSize(variant, services.length);
  const host = useServiceHost<SensorServiceHost<[boolean]>>(service);
  const color = host ? "secondary" : "primary";
  const { background, controlBackground, active } = useWidgetTheme(color)

  const handleDown = () => {
    host?.reading.setValues([!moving])
    movingRegister.refresh()
  }
  const buttonProps = useSvgButtonProps<SVGPathElement>("movement detected", host && handleDown)

  const w = 64;
  return <SvgWidget tabIndex={0} width={w} height={w} size={widgetSize}>
  <path fill={background} d="M1.707 3.28v18.41a32 32 0 000 20.62v18.41a1.967 1.967 0 001.967 1.967h19.253a32 32 0 0018.146 0h19.253a1.967 1.967 0 001.967-1.967V42.31a32 32 0 000-20.62V3.28a1.967 1.967 0 00-1.967-1.967H41.073a32 32 0 00-18.146 0H3.674A1.967 1.967 0 001.707 3.28z" />
  <path fill={controlBackground} d="M30.383 3.326a28.72 28.72 0 00-13.928 4.526.787.787 0 00-.21 1.123l3.939 5.421a.787.787 0 001.05.208 20.458 20.458 0 019.25-3.006.787.787 0 00.729-.784V4.111a.787.787 0 00-.83-.785zm3.16 0a.787.787 0 00-.756.785v6.703a.787.787 0 00.729.784 20.458 20.458 0 019.25 3.006.787.787 0 001.05-.208l3.94-5.421a.787.787 0 00-.211-1.123 28.72 28.72 0 00-13.928-4.526.787.787 0 00-.074 0zM14.33 9.576a.787.787 0 00-.494.178A28.72 28.72 0 005.229 21.6a.787.787 0 00.49 1.033l6.375 2.072a.787.787 0 00.97-.451 20.458 20.458 0 015.72-7.87.787.787 0 00.126-1.062L14.97 9.9a.787.787 0 00-.64-.324zm35.352 0a.787.787 0 00-.653.324l-3.94 5.422a.787.787 0 00.128 1.063 20.458 20.458 0 015.719 7.869.787.787 0 00.97.451l6.375-2.072a.787.787 0 00.49-1.033 28.72 28.72 0 00-8.607-11.846.787.787 0 00-.482-.178zM5.014 24.092a.787.787 0 00-.785.586 28.72 28.72 0 000 14.644.787.787 0 001.003.547l6.375-2.07a.787.787 0 00.522-.936 20.458 20.458 0 010-9.726.787.787 0 00-.522-.936l-6.375-2.07a.787.787 0 00-.218-.04zm53.984 0a.787.787 0 00-.23.039l-6.375 2.07a.787.787 0 00-.522.936 20.458 20.458 0 010 9.726.787.787 0 00.522.936l6.375 2.07a.787.787 0 001.003-.547 28.72 28.72 0 000-14.644.787.787 0 00-.773-.586zM12.297 39.258a.787.787 0 00-.203.037l-6.375 2.072a.787.787 0 00-.49 1.033 28.72 28.72 0 008.607 11.846.787.787 0 001.135-.146l3.94-5.422a.787.787 0 00-.128-1.063 20.458 20.458 0 01-5.719-7.869.787.787 0 00-.767-.488zm39.314 0a.787.787 0 00-.675.488 20.458 20.458 0 01-5.72 7.87.787.787 0 00-.126 1.062l3.94 5.422a.787.787 0 001.134.146A28.72 28.72 0 0058.771 42.4a.787.787 0 00-.49-1.033l-6.375-2.072a.787.787 0 00-.295-.037zM20.81 49.278a.787.787 0 00-.625.326l-3.94 5.421a.787.787 0 00.211 1.123 28.72 28.72 0 0013.928 4.526.787.787 0 00.83-.785v-6.703a.787.787 0 00-.729-.784 20.458 20.458 0 01-9.25-3.006.787.787 0 00-.425-.119zm22.367 0a.787.787 0 00-.41.118 20.458 20.458 0 01-9.25 3.006.787.787 0 00-.729.784v6.703a.787.787 0 00.83.785 28.72 28.72 0 0013.928-4.526.787.787 0 00.21-1.123l-3.939-5.421a.787.787 0 00-.64-.327z"/>
  <path fill={controlBackground} d="M5.64 3.988a1.259 1.259 0 00-1.257 1.26v10.59a32 32 0 0112.146-11.85H5.641zm41.83 0a32 32 0 0112.147 11.85V5.248a1.259 1.259 0 00-1.258-1.26H47.471zM4.384 48.162v10.59a1.259 1.259 0 001.258 1.26h10.888a32 32 0 01-12.146-11.85zm55.234 0a32 32 0 01-12.146 11.85h10.888a1.259 1.259 0 001.258-1.26v-10.59z"/>
  <path fill={moving ? active : controlBackground} d="M33.568 13.184a.787.787 0 00-.78.787v6.728a.787.787 0 00.677.78 10.622 10.622 0 013.533 1.148.787.787 0 001.008-.23l3.955-5.446a.787.787 0 00-.232-1.137 18.884 18.884 0 00-8.086-2.627.787.787 0 00-.075-.003zm-3.173.002a.787.787 0 00-.038.002 18.884 18.884 0 00-8.086 2.626.787.787 0 00-.232 1.137l3.955 5.445a.787.787 0 001.008.231 10.622 10.622 0 013.533-1.148.787.787 0 00.678-.78v-6.728a.787.787 0 00-.818-.785zm-10.27 4.367a.787.787 0 00-.512.193 18.884 18.884 0 00-4.998 6.879.787.787 0 00.483 1.055l6.398 2.08a.787.787 0 00.951-.405 10.622 10.622 0 012.184-3.005.787.787 0 00.09-1.03l-3.955-5.443a.787.787 0 00-.641-.324zm23.71 0a.787.787 0 00-.6.324l-3.956 5.443a.787.787 0 00.09 1.03 10.622 10.622 0 012.184 3.005.787.787 0 00.95.405l6.4-2.08a.787.787 0 00.482-1.055 18.884 18.884 0 00-4.998-6.879.787.787 0 00-.551-.193zm-29.444 9.586a.787.787 0 00-.79.609 18.884 18.884 0 000 8.504.787.787 0 001.01.57l6.399-2.078a.787.787 0 00.531-.887 10.622 10.622 0 010-3.714.787.787 0 00-.531-.887l-6.399-2.078a.787.787 0 00-.22-.04zm35.255 0a.787.787 0 00-.257.039l-6.399 2.078a.787.787 0 00-.531.887 10.622 10.622 0 010 3.714.787.787 0 00.531.887l6.399 2.078a.787.787 0 001.01-.57 18.884 18.884 0 000-8.504.787.787 0 00-.753-.61zM21.725 36.2a.787.787 0 00-.229.04l-6.398 2.08a.787.787 0 00-.483 1.054 18.884 18.884 0 004.998 6.879.787.787 0 001.153-.131l3.955-5.443a.787.787 0 00-.09-1.03 10.622 10.622 0 01-2.184-3.005.787.787 0 00-.722-.444zm20.558 0a.787.787 0 00-.73.444 10.622 10.622 0 01-2.184 3.005.787.787 0 00-.09 1.03l3.955 5.443a.787.787 0 001.153.13 18.884 18.884 0 004.998-6.878.787.787 0 00-.483-1.055l-6.398-2.08a.787.787 0 00-.22-.039zM26.645 41.28a.787.787 0 00-.65.325l-3.956 5.445a.787.787 0 00.232 1.137 18.884 18.884 0 008.086 2.627.787.787 0 00.856-.784v-6.728a.787.787 0 00-.678-.78 10.622 10.622 0 01-3.533-1.148.787.787 0 00-.357-.094zm10.72 0a.787.787 0 00-.367.094 10.622 10.622 0 01-3.533 1.148.787.787 0 00-.678.78v6.728a.787.787 0 00.856.783 18.884 18.884 0 008.086-2.626.787.787 0 00.232-1.137l-3.955-5.445a.787.787 0 00-.64-.325z"/>
  <path fill={controlBackground} {...buttonProps} d="M22.951 32a9.049 9.049 0 1018.098 0 9.049 9.049 0 10-18.098 0z" />
  </SvgWidget>
}