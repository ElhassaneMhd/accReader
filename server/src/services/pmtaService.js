const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const logger = require('../utils/logger');

class PMTAService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  // Parse PMTA log files
  async parsePMTALog(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];

      createReadStream(filePath)
        .pipe(csv({
          headers: ['timestamp', 'message_id', 'recipient', 'status', 'response', 'delay', 'size'],
          skipEmptyLines: true
        }))
        .on('data', (data) => {
          try {
            // Basic validation
            if (!data.timestamp || !data.message_id || !data.recipient) {
              errors.push(`Invalid row: ${JSON.stringify(data)}`);
              return;
            }

            // Parse timestamp
            const parsedTimestamp = new Date(data.timestamp);
            if (isNaN(parsedTimestamp.getTime())) {
              errors.push(`Invalid timestamp: ${data.timestamp}`);
              return;
            }

            // Normalize the data
            const normalizedData = {
              timestamp: parsedTimestamp,
              messageId: data.message_id.trim(),
              recipient: data.recipient.trim().toLowerCase(),
              status: data.status ? data.status.trim().toLowerCase() : 'unknown',
              response: data.response || '',
              delay: data.delay ? parseFloat(data.delay) : 0,
              size: data.size ? parseInt(data.size, 10) : 0,
              originalRow: data
            };

            results.push(normalizedData);
          } catch (error) {
            errors.push(`Error parsing row: ${error.message}`);
          }
        })
        .on('end', () => {
          logger.info(`Parsed ${results.length} PMTA log entries with ${errors.length} errors`);
          resolve({ data: results, errors });
        })
        .on('error', (error) => {
          logger.error('Error reading PMTA log file:', error);
          reject(error);
        });
    });
  }

  // Parse accounting files
  async parseAccountingFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];

      createReadStream(filePath)
        .pipe(csv({
          headers: ['timestamp', 'type', 'queue_id', 'size', 'sender', 'recipient', 'vmta', 'jobId', 'env_id', 'message_id'],
          skipEmptyLines: true
        }))
        .on('data', (data) => {
          try {
            // Basic validation
            if (!data.timestamp || !data.type) {
              errors.push(`Invalid row: ${JSON.stringify(data)}`);
              return;
            }

            const parsedTimestamp = new Date(data.timestamp);
            if (isNaN(parsedTimestamp.getTime())) {
              errors.push(`Invalid timestamp: ${data.timestamp}`);
              return;
            }

            const normalizedData = {
              timestamp: parsedTimestamp,
              type: data.type.trim().toLowerCase(), // r (receipt), d (delivery), b (bounce), etc.
              queueId: data.queue_id || '',
              size: data.size ? parseInt(data.size, 10) : 0,
              sender: data.sender ? data.sender.trim().toLowerCase() : '',
              recipient: data.recipient ? data.recipient.trim().toLowerCase() : '',
              vmta: data.vmta || '',
              jobId: data.jobId || '',
              envId: data.env_id || '',
              messageId: data.message_id || '',
              originalRow: data
            };

            results.push(normalizedData);
          } catch (error) {
            errors.push(`Error parsing row: ${error.message}`);
          }
        })
        .on('end', () => {
          logger.info(`Parsed ${results.length} accounting entries with ${errors.length} errors`);
          resolve({ data: results, errors });
        })
        .on('error', (error) => {
          logger.error('Error reading accounting file:', error);
          reject(error);
        });
    });
  }

  // Process bounce files
  async processBounceFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];

      createReadStream(filePath)
        .pipe(csv({
          headers: ['timestamp', 'recipient', 'bounce_type', 'bounce_code', 'bounce_reason', 'message_id'],
          skipEmptyLines: true
        }))
        .on('data', (data) => {
          try {
            if (!data.timestamp || !data.recipient) {
              errors.push(`Invalid bounce row: ${JSON.stringify(data)}`);
              return;
            }

            const parsedTimestamp = new Date(data.timestamp);
            if (isNaN(parsedTimestamp.getTime())) {
              errors.push(`Invalid timestamp: ${data.timestamp}`);
              return;
            }

            const normalizedData = {
              timestamp: parsedTimestamp,
              recipient: data.recipient.trim().toLowerCase(),
              bounceType: this.categorizeBounce(data.bounce_type, data.bounce_code),
              bounceCode: data.bounce_code || '',
              bounceReason: data.bounce_reason || '',
              messageId: data.message_id || '',
              isHardBounce: this.isHardBounce(data.bounce_type, data.bounce_code),
              originalRow: data
            };

            results.push(normalizedData);
          } catch (error) {
            errors.push(`Error parsing bounce row: ${error.message}`);
          }
        })
        .on('end', () => {
          logger.info(`Parsed ${results.length} bounce entries with ${errors.length} errors`);
          resolve({ data: results, errors });
        })
        .on('error', (error) => {
          logger.error('Error reading bounce file:', error);
          reject(error);
        });
    });
  }

  // Categorize bounce types
  categorizeBounce(bounceType, bounceCode) {
    const code = bounceCode ? bounceCode.toString() : '';
    
    // Hard bounces
    if (code.startsWith('5')) {
      return 'hard';
    }
    
    // Soft bounces
    if (code.startsWith('4')) {
      return 'soft';
    }

    // Check bounce type text
    const type = bounceType ? bounceType.toLowerCase() : '';
    if (type.includes('hard') || type.includes('permanent')) {
      return 'hard';
    }
    
    if (type.includes('soft') || type.includes('temporary')) {
      return 'soft';
    }

    return 'unknown';
  }

  // Determine if bounce is hard
  isHardBounce(bounceType, bounceCode) {
    return this.categorizeBounce(bounceType, bounceCode) === 'hard';
  }

  // Generate statistics from parsed data
  generateStatistics(data, type) {
    const stats = {
      totalRecords: data.length,
      dateRange: {
        start: null,
        end: null
      },
      summary: {}
    };

    if (data.length === 0) {
      return stats;
    }

    // Calculate date range
    const timestamps = data.map(item => item.timestamp).sort((a, b) => a - b);
    stats.dateRange.start = timestamps[0];
    stats.dateRange.end = timestamps[timestamps.length - 1];

    switch (type) {
      case 'pmta_log':
        stats.summary = {
          delivered: data.filter(item => item.status === 'delivered').length,
          bounced: data.filter(item => item.status === 'bounced').length,
          deferred: data.filter(item => item.status === 'deferred').length,
          other: data.filter(item => !['delivered', 'bounced', 'deferred'].includes(item.status)).length,
          totalSize: data.reduce((sum, item) => sum + (item.size || 0), 0),
          avgDelay: data.reduce((sum, item) => sum + (item.delay || 0), 0) / data.length
        };
        break;

      case 'accounting':
        stats.summary = {
          receipts: data.filter(item => item.type === 'r').length,
          deliveries: data.filter(item => item.type === 'd').length,
          bounces: data.filter(item => item.type === 'b').length,
          deferrals: data.filter(item => item.type === 'f').length,
          totalSize: data.reduce((sum, item) => sum + (item.size || 0), 0),
          uniqueRecipients: new Set(data.map(item => item.recipient)).size,
          uniqueSenders: new Set(data.map(item => item.sender)).size
        };
        break;

      case 'bounces':
        stats.summary = {
          hardBounces: data.filter(item => item.isHardBounce).length,
          softBounces: data.filter(item => !item.isHardBounce).length,
          uniqueRecipients: new Set(data.map(item => item.recipient)).size,
          bounceReasons: this.getMostCommonBounceReasons(data)
        };
        break;
    }

    return stats;
  }

  // Get most common bounce reasons
  getMostCommonBounceReasons(bounceData, limit = 10) {
    const reasonCounts = {};
    
    bounceData.forEach(bounce => {
      const reason = bounce.bounceReason || 'Unknown';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    return Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([reason, count]) => ({ reason, count }));
  }

  // Clean up uploaded files
  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`Cleaned up file: ${filePath}`);
    } catch (error) {
      logger.error(`Error cleaning up file ${filePath}:`, error);
    }
  }

  // Validate file format
  validateFileFormat(filename, expectedType) {
    const ext = path.extname(filename).toLowerCase();
    
    if (!['.csv', '.txt', '.log'].includes(ext)) {
      throw new Error('Invalid file format. Only CSV, TXT, and LOG files are supported.');
    }

    // Additional validation based on file type can be added here
    return true;
  }
}

module.exports = PMTAService;
