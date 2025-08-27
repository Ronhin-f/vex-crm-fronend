// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const saved = (() => {
  try { return localStorage.getItem("vex_lang") || "es"; } catch { return "es"; }
})();

const resources = {
  es: {
    translation: {
      app: { brand: "Vex CRM" },
      nav: {
        dashboard: "Dashboard",
        clients: "Clientes",
        orders: "Pedidos",
        tasks: "Tareas"
      },
      actions: {
        logout: "Salir",
        changeLanguage: "Cambiar idioma"
      },
      dashboard: {
        title: "Vex CRM — Dashboard",
        hello: "Hola, {{email}}"
      },
      metrics: {
        clients: "Clientes",
        tasks: "Tareas",
        followups7d: "Seguimientos (7 días)"
      },
      cards: {
        topRecentClients: "Top clientes recientes",
        noRecentClients: "No hay clientes recientes.",
        upcoming7d: "Próximos 7 días",
        noUpcoming: "Sin seguimientos próximos.",
        dueAt: "Vence:"
      }
    }
  },
  en: {
    translation: {
      app: { brand: "Vex CRM" },
      nav: {
        dashboard: "Dashboard",
        clients: "Clients",
        orders: "Orders",
        tasks: "Tasks"
      },
      actions: {
        logout: "Log out",
        changeLanguage: "Change language"
      },
      dashboard: {
        title: "Vex CRM — Dashboard",
        hello: "Hi, {{email}}"
      },
      metrics: {
        clients: "Clients",
        tasks: "Tasks",
        followups7d: "Follow-ups (7 days)"
      },
      cards: {
        topRecentClients: "Top recent clients",
        noRecentClients: "No recent clients.",
        upcoming7d: "Next 7 days",
        noUpcoming: "No upcoming follow-ups.",
        dueAt: "Due:"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: saved,
    fallbackLng: "es",
    interpolation: { escapeValue: false }
  });

export default i18n;
