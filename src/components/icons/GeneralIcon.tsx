import React from "react";
import HivelensIcon from "./HivelensIcon";

export type IconName = "hivelens";

interface GeneralIconProps extends React.SVGProps<SVGSVGElement> {
  iconName: IconName;
}

const iconComponentsMap: Record<
  IconName,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  hivelens: HivelensIcon,
};

const GeneralIcon: React.FC<GeneralIconProps> = ({ iconName, ...props }) => {
  const SpecificIconComponent = iconComponentsMap[iconName];

  if (!SpecificIconComponent) {
    console.warn(`Icono "${iconName}" no encontrado en GeneralIcon.`);
    return <span title={`Icono ${iconName} no encontrado`}>❓</span>;
  }

  return <SpecificIconComponent {...props} />;
};

export default GeneralIcon;
