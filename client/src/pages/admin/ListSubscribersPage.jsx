import React from "react";
import { useParams } from "react-router-dom";
import SubscriberManagement from "@/components/mailwizz/admin/SubscriberManagement";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const ListSubscribersPage = () => {
  const { listUid } = useParams();

  return (
    <div className="space-y-6 bg-gray-950 min-h-screen p-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl">
            Subscribers for List:{" "}
            <span className="text-blue-400">{listUid}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriberManagement listId={listUid} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ListSubscribersPage;
