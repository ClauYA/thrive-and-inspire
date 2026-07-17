// Weight-unit conversion. Stored weights are always canonical kilograms;
// members may enter/see kg or lb. Shared by the server and the client tests.
export const LB_PER_KG = 0.45359237;

export const lbToKg = (lb) => lb * LB_PER_KG;
export const kgToLb = (kg) => kg / LB_PER_KG;

// Round to one decimal place (for display).
export const roundTenth = (n) => Math.round(n * 10) / 10;
