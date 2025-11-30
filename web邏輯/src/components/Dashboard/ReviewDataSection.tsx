'use client';

/* eslint-disable i18next/no-literal-string */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFocusDiagnostics } from '@/hooks/useFocusDiagnostics';

const ADVICE_MAP: Record<string, { title: string; content: string }> = {
  '通知': {
    title: '💡 程式化優化建議',
    content: '由於您最常被「通知」中斷，建議在每次專注前，開啟勿擾模式或飛航模式，以創造一個無干擾的環境。',
  },
};

const ProgrammaticAdviceCard: React.FC<{ mostCommonReason: string | null }> = ({ mostCommonReason }) => {
  const advice = mostCommonReason ? ADVICE_MAP[mostCommonReason] : null;

  if (!advice) return null;

  return (
    <Card className="border-green-600 bg-green-50/50">
      <CardHeader>
        <CardTitle className="text-green-800">{advice.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-800">{advice.content}</p>
      </CardContent>
    </Card>
  );
};

const ReviewDataSection: React.FC = () => {
  const { isLoading, error, mostCommonReason, reasonCounts, refresh } = useFocusDiagnostics();
  const hasData = Object.keys(reasonCounts).length > 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">反思 / 數據</h2>
        <Button onClick={refresh} variant="outline" size="sm">
          重新整理
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>中斷診斷</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              <div className="h-5 w-1/2 rounded bg-gray-200 animate-pulse" />
              <div className="h-24 w-full rounded bg-gray-200 animate-pulse" />
            </div>
          )}
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {!isLoading && !error && !hasData ? (
            <div className="text-sm text-gray-600">目前尚無中斷資料。</div>
          ) : null}
          {!isLoading && !error && hasData ? (
            <div className="space-y-4">
              <div className="text-sm">
                最常見的中斷原因：
                <span className="ml-2 font-semibold">{mostCommonReason || '—'}</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>中斷原因</TableHead>
                      <TableHead className="text-right">次數</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(reasonCounts).map(([reason, count]) => (
                      <TableRow key={reason}>
                        <TableCell>{reason}</TableCell>
                        <TableCell className="text-right">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ProgrammaticAdviceCard mostCommonReason={mostCommonReason} />
    </section>
  );
};

export default ReviewDataSection;
