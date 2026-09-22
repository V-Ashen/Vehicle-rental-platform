"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaffTab from "@/components/owner/users/StaffTab";
import RolesTab from "@/components/owner/users/RolesTab";
import { Shield, Users } from "lucide-react";

export default function UsersAndRolesPage() {
  const [activeTab, setActiveTab] = useState("staff");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Users & Roles
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your staff members and configure role-based access control.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 w-full justify-start rounded-xl h-auto">
          <TabsTrigger 
            value="staff" 
            className="flex-1 max-w-[200px] data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm rounded-lg py-2"
          >
            <Users className="w-4 h-4 mr-2" />
            Staff Users
          </TabsTrigger>
          <TabsTrigger 
            value="roles" 
            className="flex-1 max-w-[200px] data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm rounded-lg py-2"
          >
            <Shield className="w-4 h-4 mr-2" />
            Custom Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="focus:outline-none">
          <StaffTab />
        </TabsContent>

        <TabsContent value="roles" className="focus:outline-none">
          <RolesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
