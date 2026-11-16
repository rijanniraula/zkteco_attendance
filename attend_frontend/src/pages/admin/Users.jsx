import React, { useEffect, useState } from "react";
import { Add, Briefcase, Clock, Edit2, FingerScan, People, Profile, ShieldTick, Status, Trash } from "iconsax-reactjs";
import { Spinner } from "@/components/ui/spinner";
import { makeApiRequest } from "@/helpers/api";
import { ENDPOINTS } from "@/helpers/constants";
import { useAuth } from "@/context/AuthContext";
import { PageTitle } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Figures from "@/components/Figures";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field, FormError } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";

const COLUMNS = [
  { icon: Profile, header: "Person", key: "name" },
  { icon: Briefcase, header: "Role", key: "role" },
  { icon: FingerScan, header: "Device user", key: "device" },
  { icon: Clock, header: "Shift group", key: "group" },
  { icon: Status, header: "Status", key: "status" },
  { header: "", key: "actions" },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "employee",
  device_user_id: "",
  shift_group_id: "",
  is_active: true,
};

const UserDialog = ({ user, deviceUsers, shiftGroups, onClose, onSaved }) => {
  const isNew = !user?.id;
  const [form, setForm] = useState(() =>
    isNew
      ? EMPTY_FORM
      : {
          name: user.name,
          email: user.email,
          password: "",
          role: user.role,
          device_user_id: user.device_user_id || "",
          shift_group_id: user.shift_group_id ? String(user.shift_group_id) : "",
          is_active: Boolean(user.is_active),
        }
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEmployee = form.role === "employee";

  const update = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  // Pick a device user: also fill in the name for new users if empty
  const handleDeviceChange = (e) => {
    const id = e.target.value;
    const device = deviceUsers.find((d) => d.device_user_id === id);
    setForm({
      ...form,
      device_user_id: id,
      name: isNew && !form.name && device?.name ? device.name : form.name,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    const body = {
      name: form.name,
      email: form.email,
      role: form.role,
      device_user_id: isEmployee ? form.device_user_id || null : null,
      shift_group_id: isEmployee && form.shift_group_id ? Number(form.shift_group_id) : null,
      is_active: form.is_active,
      ...(form.password && { password: form.password }),
    };
    try {
      await makeApiRequest({
        endpoint: isNew ? ENDPOINTS.USERS : `${ENDPOINTS.USERS}/${user.id}`,
        method: isNew ? "POST" : "PATCH",
        requestBody: body,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Show unmapped device users plus the one this user already has
  const deviceOptions = deviceUsers.filter(
    (d) => !d.mapped || d.device_user_id === user?.device_user_id
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader title={isNew ? "Add user" : `Edit ${user.name}`} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError message={error} />
          <Field
            label="Role"
            htmlFor="role"
            hint={
              isEmployee
                ? "Employees can log in to see their own attendance."
                : "Super admins manage the system. Their attendance is not tracked."
            }
          >
            <Select id="role" value={form.role} onChange={update("role")}>
              <option value="employee">Employee</option>
              <option value="super_admin">Super admin</option>
            </Select>
          </Field>
          {isEmployee && (
            <Field label="Device user" htmlFor="device_user_id"
              hint="Links this employee to punches on the device. Only unlinked device users are listed.">
              <Select id="device_user_id" value={form.device_user_id} onChange={handleDeviceChange}>
                <option value="">Not linked</option>
                {deviceOptions.map((d) => (
                  <option key={d.device_user_id} value={d.device_user_id}>
                    UID {d.device_user_id}{d.name ? ` · ${d.name}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Name" htmlFor="name">
            <Input id="name" value={form.name} onChange={update("name")} required />
          </Field>
          <Field label="Email (login)" htmlFor="email">
            <Input id="email" type="email" value={form.email} onChange={update("email")} required />
          </Field>
          <Field
            label={isNew ? "Password" : "Reset password (optional)"}
            htmlFor="password"
            hint="At least 8 characters. The user must change it at first login."
          >
            <Input id="password" type="password" autoComplete="new-password" minLength={8}
              value={form.password} onChange={update("password")} required={isNew} />
          </Field>
          {isEmployee && (
            <Field label="Shift group" htmlFor="shift_group_id" hint="Decides when a punch counts as late.">
              <Select id="shift_group_id" value={form.shift_group_id} onChange={update("shift_group_id")}>
                <option value="">None (never late)</option>
                {shiftGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </Field>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={update("is_active")}
              className="h-4 w-4 accent-primary" />
            {isEmployee ? "Active (can log in and appears in reports)" : "Active (can log in)"}
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Spinner />}
              {isNew ? "Create user" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UsersPage = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [deviceUsers, setDeviceUsers] = useState([]);
  const [shiftGroups, setShiftGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // {} = new user

  const load = async () => {
    setIsLoading(true);
    try {
      const [u, d, g] = await Promise.all([
        makeApiRequest({ endpoint: ENDPOINTS.USERS }),
        makeApiRequest({ endpoint: ENDPOINTS.DEVICE_USERS }),
        makeApiRequest({ endpoint: ENDPOINTS.SHIFT_GROUPS }),
      ]);
      setUsers(u.data);
      setDeviceUsers(d.data);
      setShiftGroups(g.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name}? Their admin edits will be removed too. Device punches are kept.`)) return;
    try {
      await makeApiRequest({ endpoint: `${ENDPOINTS.USERS}/${user.id}`, method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const notTracked = <span className="text-muted-foreground">Not tracked</span>;
  const rows = users.map((u) => ({
    name: (
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
            u.role === "super_admin" ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"
          )}
        >
          {u.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
        </span>
        <div className="min-w-0 leading-tight">
          <div className={cn("truncate font-medium", !u.is_active && "text-muted-foreground line-through decoration-rule")}>{u.name}</div>
          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
        </div>
      </div>
    ),
    role: u.role === "super_admin" ? <Badge>Super admin</Badge> : <Badge variant="secondary">Employee</Badge>,
    device: u.role === "super_admin"
      ? notTracked
      : u.device_user_id
        ? <span><span className="font-mono">#{u.device_user_id}</span>{u.device_name && <span className="text-muted-foreground"> · {u.device_name}</span>}</span>
        : <span className="text-late">Not linked</span>,
    group: u.role === "super_admin"
      ? notTracked
      : u.shift_group_name || <span className="text-muted-foreground">None</span>,
    status: u.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Disabled</Badge>,
    actions: (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" title="Edit" onClick={() => setEditing(u)}>
          <Edit2 />
        </Button>
        {u.id !== me.id && (
          <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(u)}
            className="text-destructive">
            <Trash />
          </Button>
        )}
      </div>
    ),
  }));

  const unmappedCount = deviceUsers.filter((d) => !d.mapped).length;
  const employeeCount = users.filter((u) => u.role === "employee").length;
  const adminCount = users.length - employeeCount;

  return (
    <>
      <PageTitle
        title="Users"
        description="Who can sign in, and which device ID each employee punches with."
      >
        <Button onClick={() => setEditing({})}>
          <Add /> Add user
        </Button>
      </PageTitle>
      <FormError message={error} />
      <Figures
        items={[
          { label: "employees", value: employeeCount, icon: People, tone: "primary" },
          { label: "super admins", value: adminCount, icon: ShieldTick, tone: "primary", note: "not tracked" },
          {
            label: "device users not linked",
            value: unmappedCount,
            icon: FingerScan,
            tone: unmappedCount ? "late" : "present",
            note: `of ${deviceUsers.length}`,
          },
        ]}
      />
      <Card className="overflow-x-auto p-0">
        <DataTable data={rows} columns={COLUMNS} isLoading={isLoading} />
      </Card>
      {editing && (
        <UserDialog
          key={editing.id ?? "new"}
          user={editing}
          deviceUsers={deviceUsers}
          shiftGroups={shiftGroups}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </>
  );
};

export default UsersPage;
