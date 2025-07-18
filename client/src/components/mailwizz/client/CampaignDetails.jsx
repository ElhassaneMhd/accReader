import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CampaignDetails = ({ campaignId }) => {
  // Placeholder component for campaign details view
  // This would typically fetch detailed campaign data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaign Details</h1>
        <Button variant="outline">Back to Overview</Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="success">Active</Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Campaign ID: {campaignId || "campaign-123"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Recipients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15,432</div>
                <p className="text-sm text-muted-foreground">
                  Active subscribers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.5%</div>
                <p className="text-sm text-muted-foreground">
                  Successful deliveries
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <CardTitle>Recipients List</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Recipients management interface would go here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed analytics and reporting would go here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Campaign configuration options would go here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignDetails;
