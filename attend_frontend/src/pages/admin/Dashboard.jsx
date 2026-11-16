import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Airplane, ArrowRight, Calendar, Clock, CloseCircle, Monitor, Profile2User, Refresh2, TickCircle, Timer1 } from "iconsax-reactjs";
import { useAuth } from "@/context/AuthContext";
import { greeting } from "@/helpers/format";
import { Spinner } from "@/components/ui/spinner";
import { makeApiRequest } from "@/helpers/api";
import { ENDPOINTS } from "@/helpers/constants";
import { PageTitle } from "@/components/layout/AppLayout";
import DeviceInfo from "@/components/DeviceInfo";
import Figures from "@/components/Figures";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FormError, FormSuccess } from "@/components/ui/field";

const DashboardPage = () => {
  const { user } = useAuth();
  const [device, setDevice] = useState(null);
  const [unmapped, setUnmapped] = useState([]);
  const [today, setToday] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const date = format(new Date(), "yyyy-MM-dd");
      const [info, users, report] = await Promise.all([
        makeApiRequest({ endpoint: ENDPOINTS.DEVICE_INFO }),
        makeApiRequest({ endpoint: ENDPOINTS.DEVICE_USERS }),
        makeApiRequest({ endpoint: ENDPOINTS.ATTENDANCE, query: { start: date, end: date } }),
      ]);
      setDevice(info.data);
      setUnmapped(users.data.filter((u) => !u.mapped));
      // Today's counts across linked employees only
      const counts = { present: 0, late: 0, absent: 0, pending: 0, holiday: 0, leave: 0, total: 0 };
      report.rows.filter((r) => r.editable).forEach((r) => {
        const status = r.cells[date]?.status;
        if (status in counts) counts[status] += 1;
        counts.total += 1;
      });
      setToday({ ...counts, isHoliday: report.days[0]?.isHoliday, holidayName: report.days[0]?.holidayName });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError("");
    setMessage("");
    try {
      const response = await makeApiRequest({ endpoint: ENDPOINTS.DEVICE_SYNC, method: "POST" });
      setMessage(`Sync complete: ${response.data.lastInserted} new punches.`);
      await load();
    } catch (err) {
      setError(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <PageTitle title={`${greeting()}, ${user?.name?.split(" ")[0] || ""}`} description="Here is today's attendance and the state of the office device.">
        <Button variant="outline" onClick={load} disabled={isLoading}>
          {isLoading ? <Spinner /> : <Refresh2 />}
          Refresh
        </Button>
        <Button onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? <Spinner /> : <Refresh2 />}
          Sync now
        </Button>
      </PageTitle>

      <FormError message={error} />
      <FormSuccess message={message} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <Calendar size={18} className="text-foreground/70" />
            Today
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {today?.isHoliday
                ? today.holidayName || "Day off"
                : today
                  ? `${today.present + today.late} of ${today.total} in`
                  : "…"}
            </span>
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/attendance">
              Open attendance <ArrowRight />
            </Link>
          </Button>
        </div>
        <Figures
          items={[
            { label: "on time", value: today?.present ?? "—", tone: "present", icon: TickCircle },
            { label: "late", value: today?.late ?? "—", tone: "late", icon: Timer1 },
            { label: "not in yet", value: today?.pending ?? "—", icon: Clock },
            { label: "absent", value: today?.absent ?? "—", tone: "absent", icon: CloseCircle },
            { label: "on leave", value: today?.leave ?? "—", tone: "leave", icon: Airplane },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Monitor size={18} className="text-foreground/70" />
          Office device
        </h2>
        <DeviceInfo data={device} />
      </section>

      <Card>
        <CardHeader
          icon={Profile2User}
          title="Device users not linked to an employee"
          description="Their punches are recorded but don't show up in any employee's history until you link them."
        >
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/users">Link on Users page</Link>
          </Button>
        </CardHeader>
        {unmapped.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Every device user is linked to an employee.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
            {unmapped.map((u) => (
              <div key={u.device_user_id} className="flex items-baseline gap-2 border-b border-dashed border-border py-1.5 text-[13px]">
                <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">#{u.device_user_id}</span>
                <span className="truncate">{u.name || <em className="text-muted-foreground">no name</em>}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
};

export default DashboardPage;
