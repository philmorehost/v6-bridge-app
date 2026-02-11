
export interface SMSLog {
  id: string;
  sender: string;
  message: string;
  simNickname: string;
  timestamp: Date;
  status: 'success' | 'queued' | 'failed';
  retries: number;
}

export interface GatewayConfig {
  webhookUrl: string;
  secretKey: string;
  authorizedSenders: string[];
  isSenderRestrictionEnabled: boolean;
  simNicknames: {
    slot1: string;
    slot2: string;
  };
}

export interface Stats {
  totalReceived: number;
  successfulForwards: number;
  activeRetries: number;
  uptimeSeconds: number;
}
