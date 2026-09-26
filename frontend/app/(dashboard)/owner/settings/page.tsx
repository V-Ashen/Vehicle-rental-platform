"use client";

import React from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralSettingsForm from "@/components/owner/settings/GeneralSettingsForm";
import RentalRulesForm from "@/components/owner/settings/RentalRulesForm";
import BranchSettingsTab from "@/components/owner/settings/BranchSettingsTab";

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <SettingsIcon className="w-6 h-6 mr-2 text-indigo-600" />
            Business Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your company profile, operational rules, and branches.
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg w-full justify-start h-auto">
          <TabsTrigger value="general" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-500/20 dark:data-[state=active]:text-indigo-400">
            General Profile
          </TabsTrigger>
          <TabsTrigger value="rental-rules" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-500/20 dark:data-[state=active]:text-indigo-400">
            Rental Rules
          </TabsTrigger>
          <TabsTrigger value="branches" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-500/20 dark:data-[state=active]:text-indigo-400">
            Branches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettingsForm />
        </TabsContent>

        <TabsContent value="rental-rules" className="mt-6">
          <RentalRulesForm />
        </TabsContent>

        <TabsContent value="branches" className="mt-6">
          <BranchSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
