import type React from 'react';
import type { Api } from '../../api_contract/patient';

export type { Api };
export type Order = Api.V1.Order;
export type LabOrder = Api.V1.LabOrder;
export type ImagingOrder = Api.V1.ImagingOrder;
export type SpecialTestOrder = Api.V1.SpecialTestOrder;
export type Patient = Api.V1.Patient;
export type LabResultValue = Api.V1.LabResultValue;
export type OrderStatus = Api.V1.OrderStatus;

export type OrderType = 'Lab' | 'Imaging' | 'SpecialTest';

export type ImagingModality = 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound' | 'Mammogram' | 'PET' | 'Fluoroscopy' | 'Nuclear Medicine';

export interface ICD10Concept {
    code: string;
    description: string;
}

export interface XRayExam {
    name: string;
    icon: React.FC<{className?: string}>;
}