const axios = require('axios');
const logger = require('../utils/logger');

class MailWizzService {
  constructor(apiUrl, publicKey, privateKey) {
    this.apiUrl = apiUrl;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'X-MW-PUBLIC-KEY': publicKey,
        'X-MW-PRIVATE-KEY': privateKey,
        'Content-Type': 'application/json'
      }
    });
  }

  // Campaigns
  async getAllCampaigns(page = 1, perPage = 10) {
    try {
      const response = await this.client.get(`/campaigns`, {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      logger.error('MailWizz getAllCampaigns error:', error.response?.data || error.message);
      throw new Error('Failed to fetch campaigns from MailWizz');
    }
  }

  async getCampaign(campaignId) {
    try {
      const response = await this.client.get(`/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      logger.error('MailWizz getCampaign error:', error.response?.data || error.message);
      throw new Error('Failed to fetch campaign from MailWizz');
    }
  }

  async createCampaign(campaignData) {
    try {
      const response = await this.client.post('/campaigns', campaignData);
      return response.data;
    } catch (error) {
      logger.error('MailWizz createCampaign error:', error.response?.data || error.message);
      throw new Error('Failed to create campaign in MailWizz');
    }
  }

  async updateCampaign(campaignId, campaignData) {
    try {
      const response = await this.client.put(`/campaigns/${campaignId}`, campaignData);
      return response.data;
    } catch (error) {
      logger.error('MailWizz updateCampaign error:', error.response?.data || error.message);
      throw new Error('Failed to update campaign in MailWizz');
    }
  }

  async deleteCampaign(campaignId) {
    try {
      const response = await this.client.delete(`/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      logger.error('MailWizz deleteCampaign error:', error.response?.data || error.message);
      throw new Error('Failed to delete campaign from MailWizz');
    }
  }

  async getCampaignStats(campaignId) {
    try {
      const response = await this.client.get(`/campaigns/${campaignId}/stats`);
      return response.data;
    } catch (error) {
      logger.error('MailWizz getCampaignStats error:', error.response?.data || error.message);
      throw new Error('Failed to fetch campaign stats from MailWizz');
    }
  }

  // Lists
  async getAllLists(page = 1, perPage = 10) {
    try {
      const response = await this.client.get('/lists', {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      logger.error('MailWizz getAllLists error:', error.response?.data || error.message);
      throw new Error('Failed to fetch lists from MailWizz');
    }
  }

  async getList(listId) {
    try {
      const response = await this.client.get(`/lists/${listId}`);
      return response.data;
    } catch (error) {
      logger.error('MailWizz getList error:', error.response?.data || error.message);
      throw new Error('Failed to fetch list from MailWizz');
    }
  }

  async createList(listData) {
    try {
      const response = await this.client.post('/lists', listData);
      return response.data;
    } catch (error) {
      logger.error('MailWizz createList error:', error.response?.data || error.message);
      throw new Error('Failed to create list in MailWizz');
    }
  }

  // Subscribers
  async getListSubscribers(listId, page = 1, perPage = 10) {
    try {
      const response = await this.client.get(`/lists/${listId}/subscribers`, {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      logger.error('MailWizz getListSubscribers error:', error.response?.data || error.message);
      throw new Error('Failed to fetch subscribers from MailWizz');
    }
  }

  async addSubscriber(listId, subscriberData) {
    try {
      const response = await this.client.post(`/lists/${listId}/subscribers`, subscriberData);
      return response.data;
    } catch (error) {
      logger.error('MailWizz addSubscriber error:', error.response?.data || error.message);
      throw new Error('Failed to add subscriber to MailWizz');
    }
  }

  async updateSubscriber(listId, subscriberId, subscriberData) {
    try {
      const response = await this.client.put(`/lists/${listId}/subscribers/${subscriberId}`, subscriberData);
      return response.data;
    } catch (error) {
      logger.error('MailWizz updateSubscriber error:', error.response?.data || error.message);
      throw new Error('Failed to update subscriber in MailWizz');
    }
  }

  async deleteSubscriber(listId, subscriberId) {
    try {
      const response = await this.client.delete(`/lists/${listId}/subscribers/${subscriberId}`);
      return response.data;
    } catch (error) {
      logger.error('MailWizz deleteSubscriber error:', error.response?.data || error.message);
      throw new Error('Failed to delete subscriber from MailWizz');
    }
  }

  // Templates
  async getAllTemplates(page = 1, perPage = 10) {
    try {
      const response = await this.client.get('/templates', {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      logger.error('MailWizz getAllTemplates error:', error.response?.data || error.message);
      throw new Error('Failed to fetch templates from MailWizz');
    }
  }

  async getTemplate(templateId) {
    try {
      const response = await this.client.get(`/templates/${templateId}`);
      return response.data;
    } catch (error) {
      logger.error('MailWizz getTemplate error:', error.response?.data || error.message);
      throw new Error('Failed to fetch template from MailWizz');
    }
  }

  // Customers (for admin use)
  async getAllCustomers(page = 1, perPage = 10) {
    try {
      const response = await this.client.get('/customers', {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      logger.error('MailWizz getAllCustomers error:', error.response?.data || error.message);
      throw new Error('Failed to fetch customers from MailWizz');
    }
  }

  async getCustomer(customerId) {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      logger.error('MailWizz getCustomer error:', error.response?.data || error.message);
      throw new Error('Failed to fetch customer from MailWizz');
    }
  }

  // Delivery servers
  async getDeliveryServers(page = 1, perPage = 10) {
    try {
      const response = await this.client.get('/delivery-servers', {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      logger.error('MailWizz getDeliveryServers error:', error.response?.data || error.message);
      throw new Error('Failed to fetch delivery servers from MailWizz');
    }
  }
}

// Factory function to create MailWizz service instance
const createMailWizzService = (apiUrl, publicKey, privateKey) => {
  if (!apiUrl || !publicKey || !privateKey) {
    throw new Error('MailWizz API credentials are required');
  }
  return new MailWizzService(apiUrl, publicKey, privateKey);
};

module.exports = {
  MailWizzService,
  createMailWizzService
};
