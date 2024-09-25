import resources from "../data/resources"

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'ns1';
    resources: typeof resources
  }
}