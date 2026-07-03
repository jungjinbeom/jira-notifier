import { useNav } from "@/context/contexts";
import { Layout } from "@/components/layout/Layout";
import { Settings } from "@/components/settings/Settings";
import { NotificationList } from "@/components/notifications/NotificationList";
import { TicketList } from "@/components/tickets/TicketList";
import { ASSIGNED_TAB, UNASSIGNED_TAB } from "@/components/tickets/ticketTabs";

const App = () => {
  const { tab } = useNav();

  return (
    <Layout>
      {tab === "notifications" && <NotificationList />}
      {tab === "assigned" && <TicketList {...ASSIGNED_TAB} />}
      {tab === "unassigned" && <TicketList {...UNASSIGNED_TAB} />}
      {tab === "settings" && <Settings />}
    </Layout>
  );
};

export default App;
