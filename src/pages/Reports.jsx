import { useState } from 'react';
import { toast } from 'react-toastify';
import { enqueue } from '../lib/enqueue';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Reports() {
  const [isDailyLoading, setIsDailyLoading] = useState(false);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const handleDailyReport = async () => {
    setIsDailyLoading(true);
    try {
      const job = {
        id: `report-daily-${Date.now()}`,
        action: 'daily_report',
        payload: {
          RangeHours: 24,
          MakeICS: true,
          DurationMinutes: 10
        }
      };
      const result = await enqueue(job);
      toast.success('Daily report queued successfully!');
      console.log('Daily report result:', result);
    } catch (error) {
      console.error('Error enqueuing daily report:', error);
      toast.error(`Failed to queue daily report: ${error.message}`);
    } finally {
      setIsDailyLoading(false);
    }
  };

  const handleWeeklyReport = async () => {
    setIsWeeklyLoading(true);
    try {
      const job = {
        id: `report-weekly-${Date.now()}`,
        action: 'weekly_report',
        payload: {
          RangeDays: 7,
          IncludeTop10: true,
          IncludeICS: true
        }
      };
      const result = await enqueue(job);
      toast.success('Weekly report queued successfully!');
      console.log('Weekly report result:', result);
    } catch (error) {
      console.error('Error enqueuing weekly report:', error);
      toast.error(`Failed to queue weekly report: ${error.message}`);
    } finally {
      setIsWeeklyLoading(false);
    }
  };

  const handleTestEnqueue = async () => {
    setIsTestLoading(true);
    try {
      const testJob = {
        id: `test-${Date.now()}`,
        action: 'test',
        payload: { message: 'Test enqueue from PF UI' }
      };
      const result = await enqueue(testJob);
      setTestResult(result);
      toast.success('Test enqueue successful!');
    } catch (error) {
      console.error('Test enqueue failed:', error);
      toast.error(`Test enqueue failed: ${error.message}`);
      setTestResult({ error: error.message });
    } finally {
      setIsTestLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Report</CardTitle>
            <CardDescription>Generate a report of the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleDailyReport} 
              disabled={isDailyLoading}
              className="w-full"
            >
              {isDailyLoading ? 'Generating...' : 'Generate Daily Report'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Report</CardTitle>
            <CardDescription>Generate a weekly summary report</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleWeeklyReport} 
              disabled={isWeeklyLoading}
              className="w-full"
              variant="outline"
            >
              {isWeeklyLoading ? 'Generating...' : 'Generate Weekly Report'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Test Queue Connection</CardTitle>
          <CardDescription>Test the connection to the queue service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleTestEnqueue} 
            disabled={isTestLoading}
            variant="outline"
          >
            {isTestLoading ? 'Testing...' : 'Test Enqueue'}
          </Button>
          
          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Test Result:</h3>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
