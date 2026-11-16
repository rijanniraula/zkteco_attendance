import React, { useEffect, useState } from "react";
import { Add, Calendar, Clock, Edit2, Monitor, People, Profile2User, Timer1, Trash } from "iconsax-reactjs";
import { Spinner } from "@/components/ui/spinner";
import { makeApiRequest } from "@/helpers/api";
import { ENDPOINTS, WEEKDAYS } from "@/helpers/constants";
import { PageTitle } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field, FormError, FormSuccess } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";

const GROUP_COLUMNS = [
  { icon: Profile2User, header: "Name", key: "name" },
  { icon: Timer1, header: "Late after", key: "start" },
  { icon: Clock, header: "Shift ends", key: "end" },
  { icon: Calendar, header: "Day exceptions", key: "overrides" },
  { icon: People, header: "Users", key: "users" },
  { header: "", key: "actions" },
];

const describeOverrides = (overrides) =>
  Object.entries(overrides || {})
    .map(([day, o]) =>
      `${WEEKDAYS[day].slice(0, 3)}: ${[o.start_time && `late after ${o.start_time}`, o.end_time && `ends ${o.end_time}`].filter(Boolean).join(", ")}`
    )
    .join("; ");

const ShiftGroupDialog = ({ group, onClose, onSaved }) => {
  const isNew = !group?.id;
  const [form, setForm] = useState(() => ({
    name: group?.name || "",
    start_time: group?.start_time || "09:30",
    end_time: group?.end_time || "17:00",
    is_flexible: Boolean(group?.is_flexible),
    overrides: Object.entries(group?.weekday_overrides || {}).map(([day, o]) => ({
      day,
      start_time: o.start_time || "",
      end_time: o.end_time || "",
    })),
  }));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const update = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const updateOverride = (index, key, value) =>
    setForm({
      ...form,
      overrides: form.overrides.map((o, i) => (i === index ? { ...o, [key]: value } : o)),
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    const weekday_overrides = {};
    form.overrides.forEach(({ day, start_time, end_time }) => {
      if (!start_time && !end_time) return;
      weekday_overrides[day] = {
        ...(start_time && { start_time }),
        ...(end_time && { end_time }),
      };
    });
    try {
      await makeApiRequest({
        endpoint: isNew ? ENDPOINTS.SHIFT_GROUPS : `${ENDPOINTS.SHIFT_GROUPS}/${group.id}`,
        method: isNew ? "POST" : "PUT",
        requestBody: {
          name: form.name,
          start_time: form.start_time,
          end_time: form.end_time,
          is_flexible: form.is_flexible,
          weekday_overrides,
        },
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const usedDays = form.overrides.map((o) => o.day);
  const nextFreeDay = [5, 4, 3, 2, 1, 0, 6].map(String).find((d) => !usedDays.includes(d));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader
          title={isNew ? "Add shift group" : `Edit ${group.name}`}
          description="A first punch at or after 'Late after' is marked Late."
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError message={error} />
          <Field label="Name" htmlFor="groupName">
            <Input id="groupName" value={form.name} onChange={update("name")} required />
          </Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_flexible} onChange={update("is_flexible")}
              className="h-4 w-4 accent-primary" />
            Flexible hours (never marked late)
          </label>
          {!form.is_flexible && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Late after" htmlFor="start_time">
                  <Input id="start_time" type="time" value={form.start_time} onChange={update("start_time")} required />
                </Field>
                <Field label="Shift ends" htmlFor="end_time">
                  <Input id="end_time" type="time" value={form.end_time} onChange={update("end_time")} required />
                </Field>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Day exceptions</div>
                {form.overrides.map((o, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                    <Select value={o.day} onChange={(e) => updateOverride(i, "day", e.target.value)} aria-label="Day">
                      {WEEKDAYS.map((name, d) => (
                        <option key={d} value={String(d)} disabled={usedDays.includes(String(d)) && o.day !== String(d)}>
                          {name}
                        </option>
                      ))}
                    </Select>
                    <Input type="time" value={o.start_time} aria-label="Late after"
                      onChange={(e) => updateOverride(i, "start_time", e.target.value)} />
                    <Input type="time" value={o.end_time} aria-label="Shift ends"
                      onChange={(e) => updateOverride(i, "end_time", e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" title="Remove"
                      onClick={() => setForm({ ...form, overrides: form.overrides.filter((_, j) => j !== i) })}>
                      <Trash />
                    </Button>
                  </div>
                ))}
                {nextFreeDay && (
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setForm({ ...form, overrides: [...form.overrides, { day: nextFreeDay, start_time: "", end_time: "" }] })}>
                    <Add /> Add day exception
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  Different times for specific weekdays, e.g. Friday ends at 13:15. Leave a time empty to use the default.
                </p>
              </div>
            </>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SettingsPage = () => {
  const [settings, setSettings] = useState({ zk_ip: "", sync_interval_min: 5 });
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  const loadGroups = async () => {
    const r = await makeApiRequest({ endpoint: ENDPOINTS.SHIFT_GROUPS });
    setGroups(r.data);
  };

  useEffect(() => {
    Promise.all([makeApiRequest({ endpoint: ENDPOINTS.SETTINGS }), loadGroups()])
      .then(([s]) => setSettings(s.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const saveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const r = await makeApiRequest({
        endpoint: ENDPOINTS.SETTINGS,
        method: "PUT",
        requestBody: {
          zk_ip: settings.zk_ip.trim(),
          sync_interval_min: Number(settings.sync_interval_min),
        },
      });
      setSettings(r.data);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGroup = async (group) => {
    const warning = group.user_count
      ? ` ${group.user_count} user(s) will have no shift group and will never be marked late.`
      : "";
    if (!window.confirm(`Delete shift group "${group.name}"?${warning}`)) return;
    try {
      await makeApiRequest({ endpoint: `${ENDPOINTS.SHIFT_GROUPS}/${group.id}`, method: "DELETE" });
      loadGroups();
    } catch (err) {
      setError(err.message);
    }
  };

  const rows = groups.map((g) => ({
    name: (
      <span className="flex items-center gap-2">
        {g.name} {g.is_flexible && <Badge variant="secondary">Flexible</Badge>}
      </span>
    ),
    start: g.is_flexible ? "—" : g.start_time,
    end: g.is_flexible ? "—" : g.end_time,
    overrides: <span className="text-muted-foreground">{describeOverrides(g.weekday_overrides) || "—"}</span>,
    users: g.user_count,
    actions: (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" title="Edit" onClick={() => setEditing(g)}><Edit2 /></Button>
        <Button variant="ghost" size="icon" title="Delete" className="text-destructive" onClick={() => deleteGroup(g)}>
          <Trash />
        </Button>
      </div>
    ),
  }));

  return (
    <>
      <PageTitle title="Settings" description="When a punch counts as late, and how the app reaches the office device." />
      <FormError message={error} />
      <FormSuccess message={message} />

      <Card className="overflow-x-auto">
        <CardHeader icon={Clock} title="Shift groups" description="Decide when a punch counts as late. Assign each user a group on the Users page.">
          <Button size="sm" onClick={() => setEditing({})}><Add /> Add group</Button>
        </CardHeader>
        <DataTable data={rows} columns={GROUP_COLUMNS} isLoading={isLoading} />
      </Card>

      <Card>
        <CardHeader icon={Monitor} title="Device" description="The app syncs punches from the device into its own database." />
        <form onSubmit={saveSettings} className="grid md:grid-cols-[1fr_1fr_auto] gap-3 md:items-end">
          <Field label="Device IP" htmlFor="zk_ip" hint="Leave empty to search the local network automatically.">
            <Input id="zk_ip" value={settings.zk_ip} placeholder="192.168.1.20"
              onChange={(e) => setSettings({ ...settings, zk_ip: e.target.value })} />
          </Field>
          <Field label="Sync every (minutes)" htmlFor="sync_interval" hint="Live punches are also recorded instantly.">
            <Input id="sync_interval" type="number" min={1} max={1440} value={settings.sync_interval_min}
              onChange={(e) => setSettings({ ...settings, sync_interval_min: e.target.value })} />
          </Field>
          <Button type="submit" disabled={isSaving} className="md:mb-5">
            {isSaving && <Spinner />}
            Save
          </Button>
        </form>
      </Card>

      {editing && (
        <ShiftGroupDialog group={editing} onClose={() => setEditing(null)} onSaved={loadGroups} />
      )}
    </>
  );
};

export default SettingsPage;
