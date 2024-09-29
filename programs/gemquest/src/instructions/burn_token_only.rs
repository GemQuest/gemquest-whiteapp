use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Token, Burn, Mint, TokenAccount};
// use solana_program::program_option::COption;

pub fn burn_token_only(ctx: Context<BurnTokenOnly>) -> Result<()> {
    if ctx.accounts.associated_token_account.amount < 1 {
        return Err(ErrorCode::InsufficientBalance.into());
    }

    // Vérification de l'approbation
//     if ctx.accounts.associated_token_account.delegate != COption::Some(ctx.accounts.from_authority.key())
//     || ctx.accounts.associated_token_account.delegated_amount < 1
// {
//     return Err(ErrorCode::NotApproved.into());
// }

    // Burn tokens
    let burn_cpi_accounts = Burn {
        mint: ctx.accounts.mint_token_account.to_account_info(),
        from: ctx.accounts.associated_token_account.to_account_info(),
        authority: ctx.accounts.from_authority.to_account_info(),
    };
    let burn_cpi_program = ctx.accounts.token_program.to_account_info();
    let burn_cpi_ctx = CpiContext::new(burn_cpi_program, burn_cpi_accounts);
    token::burn(burn_cpi_ctx, 1)?;

    Ok(())
}

#[derive(Accounts)]
pub struct BurnTokenOnly<'info> {
    #[account(mut)]
    pub associated_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mint_token_account: Account<'info, Mint>,

    pub from_authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid input provided.")]
    InvalidInput,
    #[msg("Invalid price provided.")]
    InvalidPrice,
    #[msg("Insufficient balance.")]
    InsufficientBalance,
    #[msg("Unauthorized access.")]
    Unauthorized,
    // #[msg("Not approved.")]
    // NotApproved,
}