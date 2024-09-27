import enNs from "../../data/en.json"
import frNs from "../../data/fr.json"

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
        en: typeof enNs;
        fr: typeof frNs;
      };
  }
}