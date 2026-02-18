# LLM Data Privacy Policy

This document describes how Shannon Web handles data sent to LLM (Large Language Model) providers and the privacy protections in place.

## API Endpoints vs Consumer Products

Shannon Web uses **API endpoints** to communicate with LLM providers, NOT playground or consumer-facing products. This distinction is important because:

- **API endpoints** typically have stronger privacy protections
- **API data is NOT used for model training** by default for major providers
- **Enterprise-grade data handling** is available through organization settings

## Provider-Specific Policies

### Anthropic (Claude)

- **Training Opt-Out**: API data is NOT used for training by default
- **Data Retention**: See [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- **No additional headers required** - privacy is built into the API terms

### OpenAI (GPT Models)

- **Training Opt-Out**: API data is NOT used for training by default (since March 2023)
- **Enterprise Controls**: Configure organization-level settings in OpenAI dashboard
- **Organization ID**: Set `OPENAI_ORG_ID` environment variable to associate requests with your organization's privacy settings
- **Documentation**: [OpenAI Enterprise Privacy](https://openai.com/enterprise-privacy)

### OpenRouter

- **Proxy Service**: Routes requests to underlying providers
- **Privacy**: Follows the data policies of the underlying model provider
- **Documentation**: [OpenRouter Privacy](https://openrouter.ai/privacy)

## Configuration

### Environment Variables

```bash
# Optional: OpenAI Organization ID for enterprise privacy controls
OPENAI_ORG_ID=org-...

# Optional: Application URL for request identification
APP_URL=https://your-app.example.com
```

### Recommended Practices

1. **Use organization accounts** with explicit opt-out settings configured
2. **Avoid sending sensitive PII** in prompts when possible
3. **Review provider policies** periodically for changes
4. **Use enterprise tiers** for maximum data protection guarantees

## Verification

To verify your privacy settings:

1. **Anthropic**: API usage automatically excludes data from training
2. **OpenAI**: Check organization settings at https://platform.openai.com/organization
3. **OpenRouter**: Review account settings and underlying provider policies

## Data Minimization

Shannon Web implements data minimization principles:

- API key validation uses minimal test payloads
- Only necessary data is sent to LLM providers
- Sensitive credentials are never sent to LLM providers

## Compliance

For organizations with specific compliance requirements (GDPR, HIPAA, SOC 2, etc.):

1. Review each provider's compliance documentation
2. Configure enterprise-level agreements where required
3. Use organization IDs to associate requests with compliant accounts
4. Maintain audit logs of LLM interactions (Shannon audit-logs)

## Updates

LLM provider policies may change. This document was last reviewed: February 2026.

Always verify current policies at:
- https://www.anthropic.com/legal/privacy
- https://openai.com/policies/privacy-policy
- https://openrouter.ai/privacy
